import vscodeApi from '../../../lib/transport/webview/vscodeApi'
import { debounce } from 'throttle-debounce'

import type { Readable } from 'svelte/store'
import { writable, get, derived } from 'svelte/store'

import phpDictionary from '../../data/phpDictionary.json'
import { arrayify } from '../../../lib/stores/arrayify'

import { phpReport, jsReport, containerReport } from './report.store'
import type { BaseImage, AssemblyFormResult } from '../../sharedTypes'
import { extension } from '../transport'

function unique(item: any, pos: number, self: any[]) {
    return self.indexOf(item) == pos
}


function apkPackageToPhpModule(apkPackage: string) {
    return apkPackage.replace(/^php\d{0,2}(-pecl)?-([a-z0-9_]+)(-dev)?$/g, '$2').replaceAll('_', '-').replaceAll(/-dev$/g, '')
}
function doesApkPackageMatchPhpModule(module: string) {
    const regex = new RegExp(`^php\\d{0,2}(-pecl)?-(${ module.replaceAll('-', '_') }|${ module })(-dev)?$`, 'g')
    return (apkPackage: string) => apkPackage.match(regex)
}


interface VscodeRememberedState {
    // windowScrollY?: number
    panelKey: string,
    phpVersion?: string
    baseImageName?: string
    baseImageTag?: string

    phpModulesFromPackageJsonCbx?: boolean
    phpModulesFromRequiredPackagesCbx?: boolean
    phpModulesRecommendedByFrameworkCbx?: boolean
    phpModulesManuallyAdded?: string[]
    phpModulesManuallyExcluded?: string[]
    documentRoot?: string
    frontController?: string
    phpPathsForBuildText?: string

    jsBuildStage?: boolean
    jsPathsForBuildText?: string
    jsBuildCommand?: string
    jsNodeImageTag?: string
    jsOutPathsText?: string

    writablePathsText?: string
    dockerIgnoreText?: string

    expandedBaseImageForm?: boolean
    expandedPhpModulesForm?: boolean
    expandedCheckedPhpModules?: boolean
    expandedDockerIgnoreForm?: boolean
    expandedPhpSourcesForm?: boolean
    expandedWritablePathsForm?: boolean
    expandedJsSourcesForm?: boolean
    expandedWebServerForm?: boolean
}
const rememberState = (stateToRemember: VscodeRememberedState) => vscodeApi.setState(stateToRemember)
const rememberedState = (vscodeApi.getState() || {}) as VscodeRememberedState

export const phpVersion = writable<string>(rememberedState.phpVersion || '')
export const phpVersions = phpDictionary.baseImages.map(bi => bi.phpVersion).filter(unique)
phpReport.subscribe($phpReport => {
    if ($phpReport && $phpReport.phpVersionFromPackageJson && ! get(phpVersion)) {
        let value = $phpReport.phpVersionFromPackageJson.toFixed(1).toString()
        if (phpDictionary.baseImages.some(bi => bi.phpVersion == value)) {
            phpVersion.set(value)
        } else {
            expandedBaseImageForm.set(true)
        }
    }
})

export const baseImageName = writable<string>(rememberedState.baseImageName || '')
export const baseImageNames: Readable<string[]> = derived(phpVersion, ($phpVersion)=>{
    return phpDictionary.baseImages
        .filter(bi => bi.phpVersion == $phpVersion)
        .map(bi => bi.baseImageName).filter(unique)
})
baseImageNames.subscribe($baseImageNames => {
    if ($baseImageNames.length == 1) {
        baseImageName.set($baseImageNames[0])
    }
})

export const baseImageTag = writable<string>(rememberedState.baseImageTag || '')
export const baseImageTags: Readable<string[]> = derived([phpVersion, baseImageName], ([$phpVersion, $baseImageName])=>{
    return phpDictionary.baseImages
        .filter(bi => bi.phpVersion == $phpVersion && bi.baseImageName == $baseImageName)
        .map(bi => bi.baseImageTag).filter(unique)
})
baseImageTags.subscribe($baseImageTags => {
    if ($baseImageTags.length > 0) {
        baseImageTag.set($baseImageTags[0])
    }
})


export const baseImage: Readable<BaseImage | undefined> = derived([phpVersion, baseImageName, baseImageTag], ([$phpVersion, $baseImageName, $baseImageTag])=>{
    return phpDictionary.baseImages
        .find(bi => bi.phpVersion == $phpVersion && bi.baseImageName == $baseImageName && bi.baseImageTag == $baseImageTag)
})

export const phpModulesAll: Readable<string[]> = derived(baseImage, $baseImage => {
    if ($baseImage) {
        return $baseImage.phpPackagesAll.map(apkPackageToPhpModule)
            .concat($baseImage.phpModulesBuiltin).sort()
    } else {
        return []
    }
})


// form checkboxes
export const phpModulesFromPackageJsonCbx = writable<boolean>(rememberedState.phpModulesFromPackageJsonCbx || true)
export const phpModulesFromRequiredPackagesCbx = writable<boolean>(rememberedState.phpModulesFromRequiredPackagesCbx || true)
export const phpModulesRecommendedByFrameworkCbx = writable<boolean>(rememberedState.phpModulesRecommendedByFrameworkCbx || true)

// when a form checkbox is on, return array of modules
export const phpModulesBuiltin: Readable<string[]> = derived(baseImage, ($baseImage)=>{
    return ($baseImage !== undefined) ? $baseImage.phpModulesBuiltin.sort() : []
})
export const phpModulesFromPackageJson: Readable<string[]> = derived([phpReport, phpModulesFromPackageJsonCbx], ([$phpReport, $phpModulesFromPackageJsonCbx])=>{
    return ($phpReport && $phpModulesFromPackageJsonCbx) ? $phpReport.phpModulesFromPackageJson.sort() : []
})
export const phpModulesFromRequiredPackages: Readable<string[]> = derived([phpReport, phpModulesFromRequiredPackagesCbx], ([$phpReport, $phpModulesFromRequiredPackagesCbx])=>{
    return ($phpReport && $phpModulesFromRequiredPackagesCbx) ? $phpReport.phpModulesFromRequiredPackages.map(d => d.module).sort() : []
})
export const phpModulesRecommendedByFramework: Readable<string[]> = derived([phpReport, phpModulesRecommendedByFrameworkCbx], ([$phpReport, $phpModulesRecommendedByFrameworkCbx])=>{
    return ($phpReport && $phpModulesRecommendedByFrameworkCbx) ? $phpReport.phpModulesRecommendedByFramework.map(d => d.module).sort() : []
})

export const phpModulesManuallyAdded = arrayify<string>(writable<string[]>(rememberedState.phpModulesManuallyAdded || []))
const phpModulesManuallyExcluded = arrayify<string>(writable<string[]>(rememberedState.phpModulesManuallyExcluded || []))
export function toggleSingleModule(phpModuleName: string, on: boolean) {
    if (on) {
        phpModulesManuallyAdded.add(phpModuleName)
        phpModulesManuallyExcluded.delete(phpModuleName)
    }
    else {
        phpModulesManuallyAdded.delete(phpModuleName)
        phpModulesManuallyExcluded.add(phpModuleName)
    }
}

export const phpModulesManuallyAddedToView: Readable<string[]> = derived(
    [phpModulesManuallyAdded, phpModulesBuiltin, phpModulesFromPackageJson, phpModulesFromRequiredPackages, phpModulesRecommendedByFramework],
    ([$phpModulesManuallyAdded, $phpModulesBuiltin, $phpModulesFromPackageJson, $phpModulesFromRequiredPackages, $phpModulesRecommendedByFramework])=>{
        return $phpModulesManuallyAdded.filter(m => ! ($phpModulesBuiltin.includes(m) || $phpModulesFromPackageJson.includes(m) || $phpModulesFromRequiredPackages.includes(m) || $phpModulesRecommendedByFramework.includes(m)))
    })

// when a form checkbox is on, and some modules are going to be added in the checked modules, remove them from manually excluded
phpModulesFromPackageJson.subscribe(addingThem => phpModulesManuallyExcluded.update(arr => arr.filter(m => !addingThem.includes(m))))
phpModulesFromRequiredPackages.subscribe(addingThem => phpModulesManuallyExcluded.update(arr => arr.filter(m => !addingThem.includes(m))))
phpModulesRecommendedByFramework.subscribe(addingThem => phpModulesManuallyExcluded.update(arr => arr.filter(m => !addingThem.includes(m))))

baseImage.subscribe($baseImage => { if ($baseImage) {
    phpModulesManuallyExcluded.update(arr => arr.filter(m => !$baseImage.phpModulesBuiltin.includes(m)))
    phpModulesManuallyAdded.update(arr => arr.filter(m => !$baseImage.phpModulesBuiltin.includes(m)))
}})

// every module either checked or not (just for presenting)
export const phpModulesChecked = derived(
    [phpModulesBuiltin, phpModulesFromPackageJson, phpModulesFromRequiredPackages, phpModulesRecommendedByFramework, phpModulesManuallyAdded, phpModulesManuallyExcluded],
    ([$phpModulesBuiltin, $phpModulesFromPackageJson, $phpModulesFromRequiredPackages, $phpModulesRecommendedByFramework, $phpModulesManuallyAdded, $phpModulesManuallyExcluded])=>{
        return [...(new Set([ ...$phpModulesBuiltin, ...$phpModulesFromPackageJson, ...$phpModulesFromRequiredPackages, ...$phpModulesRecommendedByFramework, ...$phpModulesManuallyAdded ]))]
            .filter(m => ! $phpModulesManuallyExcluded.includes(m))
    }
)

export const phpModulesFromPackageJsonExcluded: Readable<string[]> = derived([phpModulesChecked, phpModulesFromPackageJson], ([$phpModulesChecked, $phpModulesFromPackageJson])=>{
    return $phpModulesFromPackageJson.filter(m => ! $phpModulesChecked.includes(m))
})
export const phpModulesFromPackageJsonCbxIndeterminate = derived(phpModulesFromPackageJsonExcluded, $phpModulesFromPackageJsonExcluded => $phpModulesFromPackageJsonExcluded.length != 0)

export const phpModulesFromRequiredPackagesExcluded: Readable<string[]> = derived([phpModulesChecked, phpModulesFromRequiredPackages], ([$phpModulesChecked, $phpModulesFromRequiredPackages])=>{
    return $phpModulesFromRequiredPackages.filter(m => ! $phpModulesChecked.includes(m))
})
export const phpModulesFromRequiredPackagesCbxIndeterminate = derived(phpModulesFromRequiredPackagesExcluded, $phpModulesFromRequiredPackagesExcluded => $phpModulesFromRequiredPackagesExcluded.length != 0)

export const phpModulesRecommendedByFrameworkExcluded: Readable<string[]> = derived([phpModulesChecked, phpModulesRecommendedByFramework], ([$phpModulesChecked, $phpModulesRecommendedByFramework])=>{
    return $phpModulesRecommendedByFramework.filter(m => ! $phpModulesChecked.includes(m))
})
export const phpModulesRecommendedByFrameworkCbxIndeterminate = derived(phpModulesRecommendedByFrameworkExcluded, $phpModulesRecommendedByFrameworkExcluded => $phpModulesRecommendedByFrameworkExcluded.length != 0)

export const phpPackagesToInstall = derived([baseImage, phpModulesChecked, phpModulesBuiltin], ([$baseImage, $phpModulesChecked, $phpModulesBuiltin])=>{
    if ($baseImage) {
        return [
            $baseImage.apkPhpPackage,
            ...(
                $phpModulesChecked.filter(m => !$phpModulesBuiltin.includes(m))
                    .flatMap(phpModuleName => {
                        return [ $baseImage.phpPackagesAll.find(doesApkPackageMatchPhpModule(phpModuleName)) ].filter(x=>x)
                    }).sort()
            )
        ]
    } else {
        return []
    }
})


export const documentRoot = writable<string>(rememberedState.documentRoot || '')
phpReport.subscribe($phpReport => {
    if ($phpReport && $phpReport.documentRoot && ! get(documentRoot)) {
        documentRoot.set($phpReport.documentRoot)
    }
})

export const frontController = writable<string>(rememberedState.frontController || '')
phpReport.subscribe($phpReport => {
    if ($phpReport && $phpReport.frontController && ! get(frontController)) {
        frontController.set($phpReport.frontController)
    }
})


export const phpPathsForBuildText = writable<string>(rememberedState.phpPathsForBuildText || '')
phpReport.subscribe($phpReport => {
    if ($phpReport && $phpReport.pathsForBuild.length && ! get(phpPathsForBuildText)) {
        phpPathsForBuildText.set($phpReport.pathsForBuild.join('\n'))
    }
})
export const phpPathsForBuild: Readable<string[]> = derived(phpPathsForBuildText, $phpPathsForBuildText => {
    return $phpPathsForBuildText.split('\n').filter(x=>x)
})


export const nodeImages = [
    { nodeVersion: 19, caption: '19', tag: '19-alpine' },
    { nodeVersion: 18, caption: '18', tag: '18-alpine' },
    { nodeVersion: 16, caption: '16', tag: '16-alpine' },
    { nodeVersion: 14, caption: '14', tag: '14-alpine' },
]

export const npmRunScripts = writable<string[]>([])

export const jsBuildStage = writable<boolean>(typeof rememberedState.jsBuildStage == 'boolean' ? rememberedState.jsBuildStage : undefined)
export const jsBuildCommand = writable<string>(rememberedState.jsBuildCommand || '')
export const jsNodeImageTag = writable<string>(rememberedState.jsNodeImageTag || '')

export const jsOutPathsText = writable<string>(rememberedState.jsOutPathsText || '')
export const jsOutPaths: Readable<string[]> = derived(jsOutPathsText, $jsOutPathsText => {
    return $jsOutPathsText.split('\n').filter(x=>x)
})

export const jsPathsForBuildText = writable<string>(rememberedState.jsPathsForBuildText || '')
export const jsPathsForBuild: Readable<string[]> = derived(jsPathsForBuildText, $jsPathsForBuildText => {
    return $jsPathsForBuildText.split('\n').filter(x=>x)
})

jsReport.subscribe($jsReport => {
    if ($jsReport && get(jsBuildStage) === undefined) {
        if ($jsReport.hasPackageJson) {
            jsBuildStage.set(true)
            expandedJsSourcesForm.set(true)
        }
    }
    if ($jsReport && ! get(jsBuildCommand)) {
        let foundRunScript = (
            $jsReport.npmRunScripts.find(s => s.includes('prod'))
            || $jsReport.npmRunScripts.find(s => s.includes('build'))
            || $jsReport.npmRunScripts.at(0)
        )
        if (foundRunScript) {
            jsBuildCommand.set(`npm run ${foundRunScript}`)
        }
    }
    if ($jsReport && ! get(jsNodeImageTag)) {
        let foundNodeImage = (
            nodeImages.find(ni => ni.nodeVersion == $jsReport.nodeVersionFromPackageJson)
            || nodeImages.find(ni => ni.nodeVersion == 18)
        )
        if (foundNodeImage) {
            jsNodeImageTag.set(foundNodeImage.tag)
        }
    }
    if ($jsReport && $jsReport.outPaths.length && ! get(jsOutPathsText)) {
        jsOutPathsText.set($jsReport.outPaths.join('\n'))
    }
    if ($jsReport && $jsReport.npmRunScripts.length) {
        npmRunScripts.set($jsReport.npmRunScripts)
    }
    if ($jsReport && $jsReport.pathsForBuild.length && ! get(jsPathsForBuildText)) {
        jsPathsForBuildText.set($jsReport.pathsForBuild.join('\n'))
    }
})



export const writablePathsText = writable<string>(rememberedState.writablePathsText || '')
containerReport.subscribe($containerReport => {
    if ($containerReport && $containerReport.writablePaths.length && ! get(writablePathsText)) {
        writablePathsText.set($containerReport.writablePaths.join('\n'))
    }
})
export const writablePaths: Readable<string[]> = derived(writablePathsText, $writablePathsText => {
    return $writablePathsText.split('\n').filter(x=>x)
})

export const dockerIgnoreText = writable<string>(rememberedState.dockerIgnoreText || '')
export const dockerIgnoreIsExisting = writable<boolean>(undefined)
containerReport.subscribe($containerReport => {
    if ($containerReport && $containerReport.dockerIgnoreExistingText) {
        dockerIgnoreIsExisting.set(true)
        if (! get(dockerIgnoreText)) {
            dockerIgnoreText.set($containerReport.dockerIgnoreExistingText)
        }
    } else if ($containerReport && $containerReport.dockerIgnoreProposedLines.length) {
        dockerIgnoreIsExisting.set(false)
        if (! get(dockerIgnoreText)) {
            dockerIgnoreText.set($containerReport.dockerIgnoreProposedLines.join('\n'))
        }
    }
})
export function appendDockerIgnoreProposedLines() {
    if (get(containerReport) && get(containerReport).dockerIgnoreProposedLines.length) {
        dockerIgnoreText.update($dockerIgnoreText => {
            return $dockerIgnoreText + [
                '', '', '#guessed from all .gitignore files found in the sources', ...get(containerReport).dockerIgnoreProposedLines
            ].join('\n')
        })
    }
}


const serverPackagesToInstall: Readable<string[]> = derived(baseImage, $baseImage => {
    return $baseImage ? ['unit', $baseImage.apkUnitPackage] : []
})

export const serverPort = writable<number>(8080)
export const serverRequestSize = writable<number>(8)


export const expandedBaseImageForm      = writable<boolean>(rememberedState.expandedBaseImageForm       || false)
export const expandedPhpModulesForm     = writable<boolean>(rememberedState.expandedPhpModulesForm      || false)
export const expandedCheckedPhpModules  = writable<boolean>(rememberedState.expandedCheckedPhpModules   || false)
export const expandedDockerIgnoreForm   = writable<boolean>(rememberedState.expandedDockerIgnoreForm    || false)
export const expandedPhpSourcesForm     = writable<boolean>(rememberedState.expandedPhpSourcesForm      || true)
export const expandedJsSourcesForm      = writable<boolean>(rememberedState.expandedJsSourcesForm       || false)
export const expandedWritablePathsForm  = writable<boolean>(rememberedState.expandedWritablePathsForm   || false)
export const expandedWebServerForm      = writable<boolean>(rememberedState.expandedWebServerForm       || false)


export const ghaCreate = writable<boolean>(false)


export const saveEnabled: Readable<boolean> = derived(
    [baseImage, dockerIgnoreText],
    ([$baseImage, $dockerIgnoreText])=>{
        return (
            $baseImage !== undefined
            && $dockerIgnoreText.length > 0
        )
    }
)

let panelKey = rememberedState.panelKey || Math.random().toString()

function rememberStateNow() {
    rememberState({
        // windowScrollY: Math.round(window.scrollY),
        panelKey: panelKey,
        phpVersion: get(phpVersion),
        baseImageName: get(baseImageName),
        baseImageTag: get(baseImageTag),

        phpModulesFromPackageJsonCbx: get(phpModulesFromPackageJsonCbx),
        phpModulesFromRequiredPackagesCbx: get(phpModulesFromRequiredPackagesCbx),
        phpModulesRecommendedByFrameworkCbx: get(phpModulesRecommendedByFrameworkCbx),
        phpModulesManuallyAdded: get(phpModulesManuallyAdded),
        phpModulesManuallyExcluded: get(phpModulesManuallyExcluded),
        documentRoot: get(documentRoot),
        frontController: get(frontController),
        phpPathsForBuildText: get(phpPathsForBuildText),

        jsBuildStage: get(jsBuildStage),
        jsBuildCommand: get(jsBuildCommand),
        jsNodeImageTag: get(jsNodeImageTag),
        jsOutPathsText: get(jsOutPathsText),
        jsPathsForBuildText: get(jsPathsForBuildText),

        writablePathsText: get(writablePathsText),
        dockerIgnoreText: get(dockerIgnoreText),

        expandedBaseImageForm: get(expandedBaseImageForm),
        expandedPhpModulesForm: get(expandedPhpModulesForm),
        expandedCheckedPhpModules: get(expandedCheckedPhpModules),
        expandedDockerIgnoreForm: get(expandedDockerIgnoreForm),
        expandedPhpSourcesForm: get(expandedPhpSourcesForm),
        expandedWritablePathsForm: get(expandedWritablePathsForm),
        expandedJsSourcesForm: get(expandedJsSourcesForm),
        expandedWebServerForm: get(expandedWebServerForm),
    })
}

setInterval(rememberStateNow, 1000)


export const formResult: Readable<AssemblyFormResult | undefined> = derived(
    [baseImage, serverPackagesToInstall, serverPort, serverRequestSize, phpPackagesToInstall, documentRoot, frontController, phpPathsForBuild, writablePaths, dockerIgnoreText, jsBuildStage, jsBuildCommand, jsNodeImageTag, jsOutPaths, jsPathsForBuild],
    ([$baseImage, $serverPackagesToInstall, $serverPort, $serverRequestSize, $phpPackagesToInstall, $documentRoot, $frontController, $phpPathsForBuild, $writablePaths, $dockerIgnoreText, $jsBuildStage, $jsBuildCommand, $jsNodeImageTag, $jsOutPaths, $jsPathsForBuild]) => {
        if ($baseImage && $documentRoot && $frontController && $phpPathsForBuild.length && $dockerIgnoreText) {
            return {
                panelKey: panelKey,

                baseImage: $baseImage,

                serverPackagesToInstall: $serverPackagesToInstall,
                serverPort: $serverPort,
                serverRequestSize: $serverRequestSize,

                phpPackagesToInstall: $phpPackagesToInstall,
                documentRoot: $documentRoot,
                frontController: $frontController,
                phpPathsForBuild: $phpPathsForBuild,

                jsBuildStage: $jsBuildStage,
                jsBuildCommand: $jsBuildCommand,
                jsNodeImageTag: $jsNodeImageTag,
                jsOutPaths: $jsOutPaths,
                jsPathsForBuild: $jsPathsForBuild,

                writablePaths: $writablePaths,
                dockerIgnoreText: $dockerIgnoreText,
            }
        } else {
            return undefined
        }
    }
)

formResult.subscribe(debounce(100, ($formResult: AssemblyFormResult)=>{ extension.formResultChanged($formResult) }))
