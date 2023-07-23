import vscodeApi from '../../lib/transport/webview/vscodeApi'
import { Messenger } from '../../lib/transport/webview/WebviewMessenger'
import { editorSettings, themeSettings } from './stores/settings.store'

import type { DomainInterface, WebviewInterface } from '../transportContract'
import { formResult } from './stores/form.store'
import { get } from 'svelte/store'

const messenger = new Messenger()

const extension: DomainInterface = {
	showMessage: payload => messenger.postVoidPayload('showMessage', payload),
	getRepositoryReport: (fresh?: boolean) => messenger.postRequestPayload('getRepositoryReport', fresh),
	formResultChanged: payload => messenger.postVoidPayload('formResultChanged', payload),
	onWizardRequestedSave: payload => messenger.postVoidPayload('onWizardRequestedSave', payload),
	onWizardRequestedPreview: () => messenger.postVoidPayload('onWizardRequestedPreview', null),
}

const webview: WebviewInterface = {
	editorSettings(payload) {
		editorSettings.set(payload)
	},
	themeSettings(payload) {
		themeSettings.set(payload)
	},
	async getFormResult() {
		return get(formResult)
	},
}

messenger.applyReceivedMessagesTo(webview)
messenger.sendMessagesTo(vscodeApi)
messenger.subscribe()

function messengerReady(isReady: boolean): void {
	messenger.ready(isReady)
}

export { extension, messengerReady }
