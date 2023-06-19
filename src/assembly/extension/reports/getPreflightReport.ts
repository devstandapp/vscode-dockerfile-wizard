import type { WorkspaceFolder, FileType } from 'vscode'
import type { PreflightReport } from '../../sharedTypes'
import { fileExists } from './utils'

export default async function (folder: WorkspaceFolder, rootDirectoryListing: [string, FileType][], excludePattern: string): Promise<PreflightReport> {
	const report: PreflightReport = {
		detected: [],
		primary: undefined,
	}

	if (fileExists('composer.json', rootDirectoryListing)) {
		report.primary = 'php'
		report.detected.push('php')

		if (fileExists('package.json', rootDirectoryListing) || fileExists('yarn.lock', rootDirectoryListing)) {
			report.detected.push('js')
		}
	}

	if (report.primary) {
		report.detected.push('container')
	}

	return report
}
