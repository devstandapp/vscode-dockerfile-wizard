import { resolve } from 'path'
import makeViteConfig from './misc/makeViteConfig'

export default makeViteConfig({
  entry: resolve(__dirname, '../src/assembly/webview/index.ts'),
  outDir: resolve(__dirname, '../dist/assembly'),
})
