import vscode from 'vscode'

export function getWorkspaceFolder(): vscode.WorkspaceFolder {
	if (Array.isArray(vscode.workspace.workspaceFolders) && vscode.workspace.workspaceFolders.length > 0) {
		return vscode.workspace.workspaceFolders[0]
	} else {
		throw new Error('There must be a folder in the workspace')
	}
}

export function getWorkspaceFolderByUri(folderUri: vscode.Uri): vscode.WorkspaceFolder {
	if (Array.isArray(vscode.workspace.workspaceFolders) && vscode.workspace.workspaceFolders.length > 0) {
		return vscode.workspace.workspaceFolders.find((folder) => folder.uri.toString() == folderUri.toString())
	} else {
		return undefined
	}
}
