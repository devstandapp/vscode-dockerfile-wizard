import vscode from 'vscode'

export function getWorkspaceFolder(): vscode.WorkspaceFolder {
    if (Array.isArray(vscode.workspace.workspaceFolders) && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0]
    } else {
        throw new Error('There must be a folder in the workspace')
    }
}
