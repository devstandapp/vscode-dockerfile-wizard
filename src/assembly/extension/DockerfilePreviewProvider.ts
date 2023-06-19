import vscode from 'vscode'
import type { AssemblyWizardPanelProvider } from './AssemblyWizardPanelProvider'
import { assemble } from './assemble'

export class DockerfilePreviewProvider implements vscode.TextDocumentContentProvider {
	public static scheme = 'dockerfile-wizard-preview'

	private disposables: { dispose: () => any }[] = []

	readonly onDidChange: vscode.Event<vscode.Uri>
	private eeDidChange: vscode.EventEmitter<vscode.Uri>

	constructor(private assemblyWizardPanelProvider: AssemblyWizardPanelProvider) {
		this.eeDidChange = new vscode.EventEmitter<vscode.Uri>()
		this.disposables.push(this.eeDidChange)
		this.onDidChange = this.eeDidChange.event

		this.disposables.push(
			assemblyWizardPanelProvider.onDidChangeFormResult(panelKey => {
				let uri = vscode.Uri.parse(`${DockerfilePreviewProvider.scheme}://${panelKey}/Preview`)
				this.eeDidChange.fire(uri)
			})
		)
	}

	provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
		const formResult = this.assemblyWizardPanelProvider.getFormResult(uri.authority)
		return formResult ? assemble(formResult) : undefined
	}

	dispose(): any {
		console.log('%cDockerfilePreviewProvider is being disposed', 'background:pink')
		while (this.disposables.length) {
			this.disposables.pop()?.dispose()
		}
	}
}
