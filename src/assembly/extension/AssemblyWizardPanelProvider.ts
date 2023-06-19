import vscode from 'vscode'
import { shouldReportError } from '../../lib/errors/errorHandling'
import type { MessengerMessage } from '../../lib/transport/extension/ExtensionMessenger'
import { Messenger } from '../../lib/transport/extension/ExtensionMessenger'
import type { WebviewInterface, DomainInterface } from '../transportContract'
import { getEditorSettings, getThemeSettings, ifAffectsEditorSettingsThen } from '../../lib/transport/extension/getEditorSettings'
import getRepositoryReport from './reports/getRepositoryReport'
import type { AssemblyFormResult, RepositoryReport } from '../sharedTypes'
import { DockerfilePreviewProvider } from './DockerfilePreviewProvider'
import { assemble } from './assemble'
import ghaDockerBuildWorkflowText from '../data/gha-docker.yml?raw'

export class AssemblyWizardPanelProvider {
	private disposables: { dispose: () => any }[] = []

	readonly onDidChangeFormResult: vscode.Event<string>
	private eeDidChangeFormResult: vscode.EventEmitter<string>
	private formResults: Map<string, AssemblyFormResult> = new Map()
	public repositoryReport: RepositoryReport

	constructor(
		private extensionUri: vscode.Uri,
	) {
		this.eeDidChangeFormResult = new vscode.EventEmitter<string>()
		this.disposables.push(this.eeDidChangeFormResult)
		this.onDidChangeFormResult = this.eeDidChangeFormResult.event
	}

	getFormResult(panelKey: string) {
		return this.formResults.get(panelKey)
	}

	private bootstrap(folder: vscode.Uri, panel: vscode.WebviewPanel) {

		const disposables: { dispose: () => any }[] = []

		const messenger = new Messenger()
		messenger.useErrorHandler((err: Error | object, message: MessengerMessage) => {
			if (! shouldReportError(err)) { return }
			vscode.window.showErrorMessage((err instanceof Error) ? err.toString() : 'Thrown object: '+JSON.stringify(err))
		})

		const webview: WebviewInterface = {
			editorSettings: (payload) => messenger.postVoidPayload('editorSettings', payload),
			themeSettings: (payload) => messenger.postVoidPayload('themeSettings', payload),
			getFormResult: () => messenger.postRequestPayload('getFormResult', null),
		}

		const sendThemeSettings = () => webview.themeSettings(getThemeSettings())
		const sendEditorSettings = () => webview.editorSettings(getEditorSettings())
		const sendInitialPayloads = () => {
			sendThemeSettings()
			sendEditorSettings()
		}

		let panelKey: string = undefined

		const domain: DomainInterface = {
			showMessage: (payload) => {
				if (payload.error === true) {
					vscode.window.showErrorMessage(payload.message, { detail: payload.detail })
				} else {
					vscode.window.showInformationMessage(payload.message)
				}
			},
			getRepositoryReport: async (fresh?: boolean) => {
				if (fresh || this.repositoryReport === undefined) {
					this.repositoryReport = await getRepositoryReport()
				}
				return this.repositoryReport
			},
			formResultChanged: (payload) => {
				if (payload && payload.panelKey && ! panelKey) {
					panelKey = payload.panelKey
				}
				if (payload) {
					this.formResults.set(panelKey, payload)
					this.eeDidChangeFormResult.fire(panelKey)
				}
			},
			onWizardRequestedPreview: () => {
				if (! panelKey) {
					throw new Error('Calling onWizardRequestedPreview when panelKey is unknown')
				}
				let uri = vscode.Uri.parse(`${DockerfilePreviewProvider.scheme}://${panelKey}/Preview`)
				vscode.workspace.openTextDocument(uri)
					.then(async (doc) => {
						await vscode.languages.setTextDocumentLanguage(doc, 'dockerfile')
						return doc
					})
					.then(doc => {
						vscode.window.showTextDocument(doc, {
							viewColumn: vscode.ViewColumn.Beside,
							preview: true,
							preserveFocus: true,
						})
					})
			},
			onWizardRequestedSave: async (payload) => {
				const ghaCreate = payload?.ghaCreate || false
				try {
					const formResult = await webview.getFormResult()

					let dockerfileUri = vscode.Uri.joinPath(folder, 'Dockerfile')
					let dockerignoreUri = vscode.Uri.joinPath(folder, '.dockerignore')

					const dockerfileText = assemble(formResult)
					await vscode.workspace.fs.writeFile(dockerfileUri, new TextEncoder().encode(dockerfileText))
					await vscode.workspace.fs.writeFile(dockerignoreUri, new TextEncoder().encode(formResult.dockerIgnoreText))

					closeTabByUri(vscode.Uri.parse(`${DockerfilePreviewProvider.scheme}://${panelKey}/Preview`))

					if (ghaCreate) {
						const dotGithubDirectoryExist = await vscode.workspace.fs.stat(vscode.Uri.joinPath(folder, '.github')).then(()=>true, ()=>false)
						if (! dotGithubDirectoryExist) {
							await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder, '.github'))
						}
						const dotGithubWorkflowsDirectoryExist = await vscode.workspace.fs.stat(vscode.Uri.joinPath(folder, '.github', 'workflows')).then(()=>true, ()=>false)
						if (! dotGithubWorkflowsDirectoryExist) {
							await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder, '.github', 'workflows'))
						}
						await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(folder, '.github', 'workflows', 'docker.yml'), new TextEncoder().encode(ghaDockerBuildWorkflowText))
					}

					const btnOpen = 'View Dockerfile'
					vscode.window.showInformationMessage(
						(dockerignoreUri ? 'Dockerfile and .dockerignore files saved' : 'Dockerfile saved'),
						btnOpen
					).then(btn => {
						if (btn == btnOpen) {
							vscode.window.showTextDocument(dockerfileUri, { viewColumn: vscode.ViewColumn.Beside })
						}
					})
				} catch (error) {
					vscode.window.showErrorMessage('Could not save files', { detail: String(error), modal: true })
				}
			},
		}

		messenger.receiveFromAndSendTo(panel.webview).applyTo(domain).subscribe(disposables)

		vscode.window.onDidChangeActiveColorTheme(sendThemeSettings, null, disposables)
		vscode.workspace.onDidChangeConfiguration(ifAffectsEditorSettingsThen(sendEditorSettings), null, disposables)

		let prevVisible: boolean | undefined = undefined
		panel.onDidChangeViewState((event) => {
			if (event.webviewPanel.visible) {
				if (prevVisible === false) {
					prevVisible = true
					messenger.ready(true, 'PROVIDER')
					sendInitialPayloads()
				}
			} else {
				prevVisible = false
				messenger.ready(false, 'PROVIDER')
			}
		}, null, disposables)

		panel.onDidDispose(() => {
			if (panelKey) {
				this.formResults.delete(panelKey)
				this.eeDidChangeFormResult.fire(panelKey)
				closeTabByUri(vscode.Uri.parse(`${DockerfilePreviewProvider.scheme}://${panelKey}/Preview`))
			}
			messenger.dispose()
			while (disposables.length) {
				disposables.pop()?.dispose()
			}
		}, null, disposables)

		sendInitialPayloads()
	}

	public createWebviewPanel(folder: vscode.Uri): vscode.WebviewPanel {
		const panel = vscode.window.createWebviewPanel(
			'DockerfileWizard.AssemblyPanel',
			'Dockerfile Wizard',
			vscode.ViewColumn.One,
			{ enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')], enableFindWidget: true }
		)
		panel.webview.html = this.getHtmlForWebview(panel.webview)
		this.bootstrap(folder, panel)
		return panel
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		const cspHeader = `default-src 'self' ${webview.cspSource}; `
						+ `style-src 'self' 'unsafe-inline' ${webview.cspSource}; `
						+ `img-src 'self' data: ${webview.cspSource}; `
		const styleHref = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/assembly/style.css'))
		const scriptHref = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/assembly/index.iife.js'))
		return [
			'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">',
			'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
				`<meta content="${cspHeader}" http-equiv="Content-Security-Policy">`,
				`<link href="${styleHref}" rel="stylesheet">`,
				`<script defer src="${scriptHref}"></script>`,
			'</head><body></body></html>',
		].join('')
	}

	dispose(): any {
		console.log('%cAssemblyWizardPanelProvider is being disposed', 'background:pink')
		while (this.disposables.length) {
			this.disposables.pop()?.dispose()
		}
	}
}

function closeTabByUri(uri: vscode.Uri) {
	for (let tabGroup of vscode.window.tabGroups.all) {
		for (let tab of tabGroup.tabs) {
			if (typeof tab.input == 'object' && ('uri' in tab.input) && tab.input.uri && tab.input.uri.toString() === uri.toString()) {
				vscode.window.tabGroups.close(tab)
				break;
			}
		}
	}
}
