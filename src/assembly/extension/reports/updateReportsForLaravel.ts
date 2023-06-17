import vscode from 'vscode'
import type { ContainerLanguageReport, JsLanguageReport, PhpLanguageReport } from '../../sharedTypes'
import { directoryExists, directoryListed, fileExists, fileListed, unique } from './utils'

export default async function(folder: vscode.WorkspaceFolder, rootDirectoryListing: [string, vscode.FileType][], excludePattern: string, containerReport: ContainerLanguageReport, phpReport: PhpLanguageReport, jsReport: JsLanguageReport | undefined = undefined): Promise<void> {

    let phpDirectoriesPaths = [
        ...phpReport.pathsWithSources,
        ...['app', 'bootstrap', 'config', 'database', 'lang', 'public', 'resources', 'routes', 'storage'].filter(directoryListed(rootDirectoryListing)),
    ].filter(unique).sort()
    let phpFilesPaths = [
        ...['artisan', 'server.php'].filter(fileListed(rootDirectoryListing)),
    ].filter(unique).sort()

    if (phpDirectoriesPaths.includes('tests')) {
        phpDirectoriesPaths.splice(phpDirectoriesPaths.indexOf('tests'), 1)
    }

    if (phpDirectoriesPaths.includes('resources') && jsReport && jsReport.pathsWithSources.includes('resources')) {
        const resourcesDirectoryListing = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(folder.uri, 'resources'))
        const resourcesDirectories = resourcesDirectoryListing.flatMap(([path, type]) => type == vscode.FileType.Directory ? [path] : [])
        const resourcesFiles = resourcesDirectoryListing.flatMap(([path, type]) => type == vscode.FileType.File ? [path] : []).filter(p => !p.startsWith('.'))
        let resourcesDirectoriesWithoutPhpFiles: string[] = []
        for (let resourceDirectory of resourcesDirectories) {
            let foundPhpFiles = (await vscode.workspace.findFiles(new vscode.RelativePattern(folder, `resources/${resourceDirectory}/**/*.php`), excludePattern, 1))
            if (foundPhpFiles.length == 0) {
                resourcesDirectoriesWithoutPhpFiles.push(resourceDirectory)
            }
        }
        if (resourcesDirectoriesWithoutPhpFiles.length > 0) {
            phpDirectoriesPaths.splice(phpDirectoriesPaths.indexOf('resources'), 1)
            phpDirectoriesPaths.push(
                ...resourcesDirectories.filter(p => !resourcesDirectoriesWithoutPhpFiles.includes(p)).map(p => `resources/${p}`),
                ...resourcesFiles.map(p => `resources/${p}`)
            )
            phpDirectoriesPaths.sort()
        }
    }

    phpReport.pathsForBuild.push(...phpDirectoriesPaths, ...phpFilesPaths)

    if (jsReport) {
        let jsDirectoriesPaths = [
            ...['public'].filter(directoryListed(rootDirectoryListing)),
            ...jsReport.pathsWithSources,
        ].filter(unique).sort()
        let jsFilesPaths = [
            ...['vite.config.js', 'webpack.mix.js'].filter(fileListed(rootDirectoryListing))
        ].filter(unique).sort()

        jsReport.pathsForBuild.push(...jsDirectoriesPaths, ...jsFilesPaths)
    }


    if (directoryExists('bootstrap', rootDirectoryListing)) {
        const bootstrapDirectoryListing = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(folder.uri, 'bootstrap'))
        if (directoryExists('cache', bootstrapDirectoryListing)) {
            containerReport.writablePaths.push('bootstrap/cache')
        }
    }
    if (directoryExists('storage', rootDirectoryListing)) {
        containerReport.writablePaths.push('storage')
    }

    if (directoryExists('public', rootDirectoryListing)) {
        const publicDirectoryListing = await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(folder.uri, 'public'))
        if (fileExists('index.php', publicDirectoryListing)) {
            phpReport.documentRoot = 'public'
            phpReport.frontController = 'index.php'
        }
    }

    recommendModule(phpReport, 'curl',      '', 'Guzzle HTTP client')
    recommendModule(phpReport, 'zip',       '', 'Composer package manger')
    recommendModule(phpReport, 'phar',      '', 'Composer package manger')
    recommendModule(phpReport, 'pcntl',     '', 'Laravel queue workers')
    recommendModule(phpReport, 'pcntl',     '', 'Tinker console')
    recommendModule(phpReport, 'posix',     '', 'Laravel queue workers')
    recommendModule(phpReport, 'posix',     '', 'Tinker console')
    recommendModule(phpReport, 'readline',  '', 'Tinker console')

    recommendModule(phpReport, 'pdo-mysql', '', 'Database driver')
    recommendModule(phpReport, 'pdo-pgsql', '', 'Database driver')
    recommendModule(phpReport, 'pdo-sqlite', '', 'Database driver')

    if (jsReport) {
        // TODO actually detect where built frontend is stored
        jsReport.outPaths.push('public/build')
    }

    return Promise.resolve()
}

function recommendModule(phpReport: PhpLanguageReport, module: string, dependency: string, note: string) {
    const row = phpReport.phpModulesRecommendedByFramework.find(row => row.module == module)
    if (row) { row.related.push({ dependency, note }) }
    else { phpReport.phpModulesRecommendedByFramework.push({ module, related: [{ dependency, note }] }) }
}
