import vscode from 'vscode'
import type { ContainerLanguageReport } from '../../sharedTypes'
import { fileExists, listed, unique, makeExclude } from './utils'

export default async function (folder: vscode.WorkspaceFolder, rootDirectoryListing: [string, vscode.FileType][], excludePattern: string): Promise<ContainerLanguageReport> {
	const report: ContainerLanguageReport = {
		language: 'container',
		dockerIgnoreExistingText: undefined,
		dockerIgnoreProposedLines: [],
		writablePaths: [],
	}

	if (fileExists('.dockerignore', rootDirectoryListing)) {
		report.dockerIgnoreExistingText = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder.uri, '.dockerignore')).then((data) => data.toString())
	}

	report.dockerIgnoreProposedLines = [...(await proposeDockerIgnoreFromGitIgnore(folder, rootDirectoryListing)), ...(await proposeDockerIgnoreFromPopularIgnore(folder, rootDirectoryListing))].filter(
		unique
	)

	return Promise.resolve(report)
}

async function proposeDockerIgnoreFromGitIgnore(folder: vscode.WorkspaceFolder, rootDirectoryListing: [string, vscode.FileType][] = []): Promise<string[]> {
	const { excludePattern, ignored } = await makeExclude(folder, rootDirectoryListing)
	// console.log('excludePattern', excludePattern.split(','))

	const foundGitIgnoreFiles = (await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/.gitignore'), excludePattern, 500)).filter(
		(gitignoreUri) => gitignoreUri.path != vscode.Uri.joinPath(folder.uri, '.gitignore').path
	)

	await Promise.allSettled(
		foundGitIgnoreFiles.map((gitignoreUri) => {
			const relativeDirname = gitignoreUri.path.replace(folder.uri.path + '/', '').replace(/\/\.gitignore$/, '')
			return vscode.workspace.fs
				.readFile(gitignoreUri)
				.then((data) =>
					data
						.toString()
						.split('\n')
						.filter((x) => x)
				)
				.then((lines) => {
					lines
						.filter((line) => line != '!.gitignore')
						.forEach((line) => {
							if (line.startsWith('!')) {
								ignored.add('!' + relativeDirname + '/' + line.substring(1).replace(/\/$/, ''))
							} else {
								ignored.add(relativeDirname + '/' + line)
							}
						})
				})
		})
	)

	// TODO: add custom sort for the ignores
	// this is ok: "!storage/app/public", "storage/app/public/*",
	// this is NOT ok: "storage/app/public/*", "!storage/app/public",
	// Maybe??? we should sort the order in which .gitignore are read

	return Promise.resolve(Array.from(ignored))
}

async function proposeDockerIgnoreFromPopularIgnore(folder: vscode.WorkspaceFolder, rootDirectoryListing: [string, vscode.FileType][] = []): Promise<string[]> {
	// TODO: check paths with * diffrently (with regex, not ==)
	return Promise.resolve(
		[
			'.git',
			'.gitignore',
			'.vs',
			'.vscode',
			'.fleet',
			'.idea',
			'.env',
			'.env.*',
			'.project',
			'.classpath',
			'.settings',
			'.toolstarget',
			'*.*proj.user',
			'*.dbmdl',
			'*.jfm',
			'.dockerignore',
			'docker-compose*',
			'compose*',
			'Dockerfile*',
			'bin',
			'obj',
			'charts',
			'node_modules',
			'npm-debug.log',
			'secrets.dev.yaml',
			'values.dev.yaml',
			'LICENSE',
		].filter(listed(rootDirectoryListing))
	)
}
