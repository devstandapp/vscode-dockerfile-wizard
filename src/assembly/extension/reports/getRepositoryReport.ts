import vscode from 'vscode'
import { makeExclude } from './utils'
import type { RepositoryReport, LanguageReport, PhpLanguageReport, JsLanguageReport, ContainerLanguageReport } from '../../sharedTypes'
import getPreflightReport from './getPreflightReport'
import getPhpLanguageReport from './getPhpLanguageReport'
import getJsLanguageReport from './getJsLanguageReport'
import updateReportsForLaravel from './updateReportsForLaravel'
import getContainerLanguageReport from './getContainerLanguageReport'
import { getWorkspaceFolder } from '../../../lib/extension/getWorkspaceFolder'

export default async function (): Promise<RepositoryReport> {
	const folder = getWorkspaceFolder()
	const rootDirectoryListing = await vscode.workspace.fs.readDirectory(folder.uri)
	const { excludePattern } = await makeExclude(folder, rootDirectoryListing)

	const preflight = await getPreflightReport(folder, rootDirectoryListing, excludePattern)
	if (preflight.primary == undefined) {
		return { preflight, languages: [] }
	}

	const languages = await Promise.allSettled(
		preflight.detected.map((language) => {
			if (language == 'container') {
				return getContainerLanguageReport(folder, rootDirectoryListing, excludePattern)
			} else if (language == 'js') {
				return getJsLanguageReport(folder, rootDirectoryListing, excludePattern)
			} else if (language == 'php') {
				return getPhpLanguageReport(folder, rootDirectoryListing, excludePattern)
			} else {
				throw new Error('unknown language')
			}
		})
	).then((results) => {
		return (results.filter((r) => r.status == 'fulfilled') as PromiseFulfilledResult<LanguageReport>[]).map((result) => result.value)
	})

	const phpReport = languages.find((r) => r.language == 'php') as PhpLanguageReport
	const jsReport = languages.find((r) => r.language == 'js') as JsLanguageReport
	const containerReport = languages.find((r) => r.language == 'container') as ContainerLanguageReport

	if (preflight.primary == 'php' && phpReport && (phpReport.framework == 'laravel' || phpReport.framework == 'lumen')) {
		await updateReportsForLaravel(folder, rootDirectoryListing, excludePattern, containerReport, phpReport, jsReport)
	}

	return { preflight, languages }
}
