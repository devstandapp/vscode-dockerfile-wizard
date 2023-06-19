export interface BaseImage {
	baseImageName: string
	baseImageTag: string
	phpVersion: string
	phpBinaryPath: string
	unitVersion: string
	apkPhpPackage: string
	apkUnitPackage: string
	phpModulesBuiltin: string[]
	phpPackagesAll: string[]
}

export interface AssemblyFormResult {
	panelKey: string

	baseImage: BaseImage

	serverPackagesToInstall: string[]
	serverPort: number
	serverRequestSize: number

	phpPackagesToInstall: string[]
	documentRoot: string
	frontController: string
	phpPathsForBuild: string[]

	jsBuildStage: boolean
	jsBuildCommand: string
	jsNodeImageTag: string
	jsOutPaths: string[]
	jsPathsForBuild: string[]

	writablePaths: string[]
	dockerIgnoreText: string
}

export type Language = 'php' | 'js' | 'container'

export type LanguageReport = PhpLanguageReport | JsLanguageReport | ContainerLanguageReport

export interface RepositoryReport {
	preflight: PreflightReport
	languages: LanguageReport[]
}

export interface PreflightReport {
	detected: Language[]
	primary?: Language
}

export type PhpFramework = 'laravel' | 'lumen'

export type PhpModule = { module: string; related: { dependency: string; note?: string }[] }

export interface ContainerLanguageReport {
	language: 'container'
	dockerIgnoreExistingText: string | undefined
	dockerIgnoreProposedLines: string[]
	writablePaths: string[]
}

export interface PhpLanguageReport {
	language: 'php'
	pathsWithSources: string[]
	pathsForBuild: string[]
	pathsForDevBuild: string[]
	hasComposerJson: boolean
	hasComposerLock: boolean
	framework: PhpFramework | undefined
	frameworkVersion: number | undefined
	phpVersionFromPackageJson: number | undefined
	phpModulesFromPackageJson: string[]
	phpModulesFromRequiredPackages: PhpModule[]
	phpModulesSuggestedByRequiredPackages: PhpModule[]
	phpModulesRecommendedByFramework: PhpModule[]
	phpModulesFromDevPackages: PhpModule[]
	documentRoot: string | undefined
	frontController: string | undefined
}

export interface JsLanguageReport {
	language: 'js'
	pathsWithSources: string[]
	pathsForBuild: string[]
	pathsForDevBuild: string[]
	hasPackageJson: boolean
	hasPackageLock: boolean
	hasYarnLock: boolean
	npmRunScripts: string[]
	outPaths: string[]
	nodeVersionFromPackageJson: number | undefined
}
