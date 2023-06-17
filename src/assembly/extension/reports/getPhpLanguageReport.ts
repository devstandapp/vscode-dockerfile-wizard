import vscode from 'vscode'
import type { PhpLanguageReport, PhpModule } from '../../sharedTypes'
import { fileExists, maxVersion, readJsonFile } from './utils'

export default async function(folder: vscode.WorkspaceFolder, rootDirectoryListing: [string, vscode.FileType][], excludePattern: string): Promise<PhpLanguageReport> {

    const report: PhpLanguageReport = {
        language: 'php',
        hasComposerJson: false,
        hasComposerLock: false,
        framework: undefined,
        frameworkVersion: undefined,
        phpVersionFromPackageJson: undefined,
        phpModulesFromPackageJson: [],
        phpModulesFromRequiredPackages: [],
        phpModulesSuggestedByRequiredPackages: [],
        phpModulesRecommendedByFramework: [],
        phpModulesFromDevPackages: [],
        pathsForBuild: [],
        pathsForDevBuild: [],
        documentRoot: undefined,
        frontController: undefined,
        pathsWithSources: [],
    }

    report.hasComposerJson = fileExists('composer.json', rootDirectoryListing)
    report.hasComposerLock = fileExists('composer.lock', rootDirectoryListing)

    const composerJson = report.hasComposerJson
        ? await readJsonFile(vscode.Uri.joinPath(folder.uri, 'composer.json')) : undefined
    const composerJsonRequired = (composerJson && typeof composerJson['require'] == 'object')
        ? Object.keys(composerJson['require']) : []
    const composerJsonDev = (composerJson && typeof composerJson['require-dev'] == 'object')
        ? Object.keys(composerJson['require-dev']) : []

    report.phpVersionFromPackageJson = composerJson && composerJsonRequired.includes('php')
        ? maxVersion(composerJson['require']['php'].toString()) : undefined

    report.phpModulesFromPackageJson = extractModules(composerJsonRequired.concat(...composerJsonDev))

    if (composerJson && composerJsonRequired.includes('laravel/framework')) {
        report.framework = 'laravel'
        report.frameworkVersion = maxVersion(composerJson['require']['laravel/framework'])
    }
    if (composerJson && composerJsonRequired.includes('laravel/lumen-framework')) {
        report.framework = 'lumen'
        report.frameworkVersion = maxVersion(composerJson['require']['laravel/lumen-framework'])
    }

    const composerLock = report.hasComposerLock
        ? await readJsonFile(vscode.Uri.joinPath(folder.uri, 'composer.lock')) : undefined

    report.phpModulesFromRequiredPackages = (composerLock && Array.isArray(composerLock['packages']))
        ? extractModulesListFromPkg(composerLock['packages'])
        : []

    report.phpModulesFromDevPackages = (composerLock && Array.isArray(composerLock['packages-dev']))
        ? extractModulesListFromPkg(composerLock['packages-dev'])
        : []

    report.phpModulesSuggestedByRequiredPackages = (composerLock && Array.isArray(composerLock['packages']))
        ? extractModulesListFromPkg(composerLock['packages'], 'suggest', true)
        : []

    const topLevelDirectories = rootDirectoryListing.flatMap(([path, type]) => type == vscode.FileType.Directory ? [path] : [])
    for (let directory of topLevelDirectories) {
        let foundPhpFiles = (await vscode.workspace.findFiles(new vscode.RelativePattern(folder, `${directory}/**/*.php`), excludePattern, 1))
        if (foundPhpFiles.length > 0) {
            report.pathsWithSources.push(directory)
        }
    }

    return Promise.resolve(report)

}

function extractModules(extOrPkgNames: string[]) {
    return extOrPkgNames
        .filter(extOrPkg => extOrPkg.startsWith('ext-') && ! extOrPkg.includes('/'))
        .map(ext => ext.replace(/^ext-/, ''))
}

function extractModulesListFromPkg(pkgs: object[], pkgProperty: string = 'require', valueAsNote: boolean = false): PhpModule[] {
    const raw = pkgs
        .flatMap(pkg => (
            (! (typeof pkg == 'object' && ('name' in pkg) && typeof pkg[pkgProperty] == 'object')) ? [] : (
                extractModules(Object.keys(pkg[pkgProperty]))
                    .map(ext => [ext, pkg['name'], (valueAsNote ? pkg[pkgProperty]['ext-'+ext] : undefined)])
            )
        ))
    return Array.from(new Set(raw.map(item => item[0])))
        .map(module => ({
            module: module,
            related: raw.filter(item => item[0] == module).map(item => ({
                dependency: item[1],
                note: item[2],
            }))
        }))
}
