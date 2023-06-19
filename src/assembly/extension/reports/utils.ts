import vscode from 'vscode'

export function maxVersion(range: string): number | undefined {
	let allVersions = dummyFindMajorMinorVersions(range)
	return allVersions.length > 0 ? Math.max(...allVersions) : undefined
}

export function dummyFindMajorMinorVersions(range: string): number[] {
	const regex = /(^|[^\.\d])(?<MAJMINVER>\d{1,}(\.\d{1,})?)/gm
	const foundVersions: Set<number> = new Set()
	let m: RegExpExecArray | null
	while ((m = regex.exec(range)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++
		}
		let version: string | undefined = m?.groups?.MAJMINVER
		if (version) {
			foundVersions.add(parseFloat(version))
		}
	}
	return Array.from(foundVersions)
}

export async function readJsonFile(uri: vscode.Uri): Promise<object | undefined> {
	try {
		let json = JSON.parse(await vscode.workspace.fs.readFile(uri).then((data) => data.toString()))
		return typeof json == 'object' && Object.keys(json).length > 0 ? json : undefined
	} catch (error) {
		return undefined
	}
}

export function listed(listing: [string, vscode.FileType][], fileType: vscode.FileType | undefined = undefined) {
	return (path: string): boolean => listing.some(([name, type]) => name == path && (fileType == undefined ? true : type == fileType))
}
export function directoryListed(listing: [string, vscode.FileType][]) {
	return listed(listing, vscode.FileType.Directory)
}
export function fileListed(listing: [string, vscode.FileType][]) {
	return listed(listing, vscode.FileType.File)
}
export function exists(path: string, listing: [string, vscode.FileType][]) {
	return [path].some(listed(listing))
}
export function fileExists(path: string, listing: [string, vscode.FileType][]) {
	return [path].some(fileListed(listing))
}
export function directoryExists(path: string, listing: [string, vscode.FileType][]) {
	return [path].some(directoryListed(listing))
}

export function unique(item: any, pos: number, self: any[]) {
	return self.indexOf(item) == pos
}

export async function makeExclude(
	folder: vscode.WorkspaceFolder,
	rootDirectoryListing: [string, vscode.FileType][],
	ignoreGitIgnore = false,
	defaultExcludedDirectories: string[] = ['node_modules', 'vendor']
): Promise<{ excludePattern: string; ignored: Set<string> }> {
	let ignored: Set<string> = new Set()
	if (directoryExists('.git', rootDirectoryListing)) {
		ignored.add('.git')
	}

	if (!ignoreGitIgnore) {
		const rootGitIgnoreLines: string[] = fileExists('.gitignore', rootDirectoryListing)
			? (await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder.uri, '.gitignore')).then((data) => data.toString())).split('\n').filter((x) => x)
			: []
		rootGitIgnoreLines.forEach((line) => ignored.add(line.replace(/^\//, '').replace(/\/$/, '').trim()))
	}

	let excludePattern =
		'{' +
		[...ignored, ...defaultExcludedDirectories]
			.flatMap((line) => {
				if (line.startsWith('!')) {
					return []
				}
				if (line.startsWith('*') || line.endsWith('*')) {
					if (line.startsWith('*/')) {
						line = '*' + line
					}
					if (line.endsWith('/*')) {
						line = line + '*'
					}
					return [line]
				} else {
					return [line, line + '/**']
				}
			})
			.concat(['**/node_modules/**'])
			.join(',') +
		'}'

	return { excludePattern, ignored }
}
