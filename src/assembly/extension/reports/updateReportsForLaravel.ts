import vscode from 'vscode'
import type { ContainerLanguageReport, JsLanguageReport, PhpLanguageReport, PhpModule } from '../../sharedTypes'
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

	if (phpReport.framework == 'laravel' && ! phpReport.phpModulesFromRequiredPackages.some(m => (
		m.module == 'session' && m.related.some(r => r.dependency == 'laravel/framework')
	))) {
		pushPhpModule(phpReport.phpModulesFromRequiredPackages, 'session', 'laravel/framework', '')
	}

	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'curl',      '', 'Guzzle HTTP client')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'zip',       '', 'Composer package manger')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'phar',      '', 'Composer package manger')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'pcntl',     '', 'Laravel queue workers')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'pcntl',     '', 'Tinker console')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'posix',     '', 'Laravel queue workers')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'posix',     '', 'Tinker console')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'readline',  '', 'Tinker console')

	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'pdo-mysql', '', 'Database driver')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'pdo-pgsql', '', 'Database driver')
	pushPhpModule(phpReport.phpModulesRecommendedByFramework,   'pdo-sqlite', '', 'Database driver')

	if (jsReport) {
		// TODO actually detect where built frontend is stored
		jsReport.outPaths.push('public/build')
	}

	return Promise.resolve()
}

function pushPhpModule(collection: PhpModule[], module: string, dependency: string, note: string) {
	let item = collection.find(i => i.module == module)
	if (! item) {
		collection.push({ module, related: [] })
		item = collection.find(i => i.module == module)
	}
	item.related.push({ dependency, note })
}
