import { defineConfig, UserConfigExport } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default function(arg: { outDir: string, entry: string, fileName?: string }): UserConfigExport {
  // https://vitejs.dev/config/
  return defineConfig({
    build: {
      outDir: arg.outDir,
      lib: {
        entry: arg.entry,
        fileName: (arg.fileName || arg.entry.split('/').pop()?.split('.').shift() || 'undefined'),
        formats: ['iife'],
        name: 'Webview',
      },
    },
    plugins: [svelte({
      onwarn(warning, defaultHandler) {
        if (warning.code.startsWith('a11y')) { return }
        if (typeof defaultHandler == 'function') {
          defaultHandler(warning)
        }
      }
    })],
  })
}
