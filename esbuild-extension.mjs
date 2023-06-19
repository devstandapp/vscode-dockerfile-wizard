import esbuild from 'esbuild'
import { copyFileSync, mkdirSync } from 'fs'

import minimist from 'minimist'
const args = minimist(process.argv.slice(2), { boolean: ['minify', 'sourcemap', 'watch'] })

mkdirSync('dist', { recursive: true, mode: 0o755 })
copyFileSync('media/icon-256x256.png', 'dist/icon-256x256.png')

esbuild
	.build({
		entryPoints: [
			'src/extension.ts'
		],
		platform: 'node',
		format: 'cjs',
		outfile: 'dist/extension/main.cjs',
		external: [
			'vscode',
			'child_process',
		],
		loader: {
			'.yml': 'text',
		},
		bundle: true,
		minify: !! args.minify,
		splitting: false,
		sourcemap: args.sourcemap ? 'inline' : false,
		metafile: true,
		watch: (args.watch ? {
			onRebuild(error, result) {
				console.log('[watch] build started')
				if (error) {
					error.errors.forEach(error => console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`))
				} else {
					console.log('[watch] build finished')
				}
			},
		} : false),
	})
	.then(() => args.watch && console.log('[watch] build finished'))
	.catch(() => process.exit(1))
