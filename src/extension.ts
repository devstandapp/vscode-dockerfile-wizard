import vscode from 'vscode'

import { AssemblyWizardPanelProvider } from './assembly/extension/AssemblyWizardPanelProvider'
import { DockerfilePreviewProvider } from './assembly/extension/DockerfilePreviewProvider'
import { getWorkspaceFolder } from './lib/extension/getWorkspaceFolder'

export function activate(context: vscode.ExtensionContext) {

	const assemblyWizardPanelProvider = new AssemblyWizardPanelProvider(context.extensionUri)
	context.subscriptions.push(vscode.Disposable.from(assemblyWizardPanelProvider))

	context.subscriptions.push(
		vscode.commands.registerCommand('DockerfileWizard.openAssemblyPanel', () => {
			assemblyWizardPanelProvider.createWebviewPanel(getWorkspaceFolder().uri).reveal()
		})
	)

	const dockerfilePreviewProvider = new DockerfilePreviewProvider(assemblyWizardPanelProvider)
	context.subscriptions.push(vscode.Disposable.from(dockerfilePreviewProvider))

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(DockerfilePreviewProvider.scheme, dockerfilePreviewProvider)
	)
}

export function deactivate() {}
