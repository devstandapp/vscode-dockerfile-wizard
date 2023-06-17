import vscode from 'vscode'
import type { JsLanguageReport } from '../../sharedTypes'
import { fileExists, readJsonFile } from './utils'

export default async function(folder: vscode.WorkspaceFolder, rootDirectoryListing: [string, vscode.FileType][], excludePattern: string): Promise<JsLanguageReport> {
    const report: JsLanguageReport = {
        language: 'js',
        pathsForBuild: [],
        pathsForDevBuild: [],
        hasPackageJson: false,
        hasPackageLock: false,
        hasYarnLock: false,
        npmRunScripts: [],
        outPaths: [],
        nodeVersionFromPackageJson: undefined,
        pathsWithSources: [],
    }

    report.hasPackageJson = fileExists('package.json', rootDirectoryListing)
    report.hasPackageLock = fileExists('package-lock.json', rootDirectoryListing)
    report.hasYarnLock = fileExists('yarn.lock', rootDirectoryListing)

    const packageJson = report.hasPackageJson
        ? await readJsonFile(vscode.Uri.joinPath(folder.uri, 'package.json')) : undefined

    report.npmRunScripts = (packageJson && typeof packageJson['scripts'] == 'object')
        ? Object.keys(packageJson['scripts']) : []

    const topLevelDirectories = rootDirectoryListing.flatMap(([path, type]) => type == vscode.FileType.Directory ? [path] : [])
    for (let directory of topLevelDirectories) {
        let foundFrontendFiles = (await vscode.workspace.findFiles(new vscode.RelativePattern(folder, `${directory}/**/*.{js,css,ts,scss}`), excludePattern, 1))
        if (foundFrontendFiles.length > 0) {
            report.pathsWithSources.push(directory)
        }
    }

    return Promise.resolve(report)
}
