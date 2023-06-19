import vscodeApi from '../../../lib/transport/webview/vscodeApi'
import type { Readable } from 'svelte/store'
import { derived, writable } from 'svelte/store'
import type { ContainerLanguageReport, JsLanguageReport, PhpLanguageReport, PreflightReport, RepositoryReport } from '../../sharedTypes'

import { extension } from '../transport'

export const preflightReport = writable<PreflightReport>(undefined)
export const phpReport = writable<PhpLanguageReport | undefined>(undefined)
export const jsReport = writable<JsLanguageReport | undefined>(undefined)
export const containerReport = writable<ContainerLanguageReport | undefined>(undefined)

export const detected: Readable<boolean|undefined> = derived(preflightReport, ($preflightReport)=> {
	if ($preflightReport === undefined) {
		return undefined
	} else if ($preflightReport && $preflightReport.primary !== undefined) {
		return true
	} else {
		return false
	}
})

setTimeout(() => {
	extension.getRepositoryReport(!vscodeApi.getState()).then(repositoryReport => {
		preflightReport.set(repositoryReport.preflight)
		containerReport.set((repositoryReport.languages.find(report => report.language == 'container') as ContainerLanguageReport) || undefined)
		phpReport.set((repositoryReport.languages.find(report => report.language == 'php') as PhpLanguageReport) || undefined)
		jsReport.set((repositoryReport.languages.find(report => report.language == 'js') as JsLanguageReport) || undefined)
	})
}, 5)
