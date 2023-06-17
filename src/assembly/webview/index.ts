import '../../lib/webview/css/reset.css'
import '../../lib/webview/css/settings.css'
import '../../lib/webview/css/components.css'
import '../../lib/webview/css/input-check.css'
import '../../lib/webview/css/component-preferences.css'
import '../../lib/webview/css/sizes-rs.css'
import '../../lib/webview/css/sizes-fs.css'
import '../../lib/webview/css/sizes-gs.css'
import '../../lib/webview/css/colors.css'
import '../../lib/webview/css/utilities.css'

import WebviewAssemblyWizard from './WebviewAssemblyWizard.svelte'

const app = new WebviewAssemblyWizard({
  target: document.body
})

export default app
