import vscode from 'vscode'
import { normaliseErr, convertErrToPayload, convertPayloadToErr } from '../../errors/errorHandling'

interface MessengerMessage {
	is: 'void' | 'request' | 'response' | 'error' | 'ready'
	from: 'webview' | 'extension'
	requestId?: number
	payload?: any
	command?: string
}

class Messenger {
	requestIdSequence: number = 1

	private disposables: vscode.Disposable[] = []

	public openDeveloperToolsOnReady: boolean = false

	private facade: object | undefined
	applyReceivedMessagesTo(facade: object) {
		this.facade = facade
	}
	applyTo(facade: object) {
		this.applyReceivedMessagesTo(facade)
		return this
	}

	private errorHandler: Function | undefined = undefined
	useErrorHandler(errorHandler: Function) {
		this.errorHandler = errorHandler
	}
	onError(errorHandler: Function) {
		this.useErrorHandler(errorHandler)
		return this
	}

	private sender: { postMessage:Function } | undefined
	sendMessagesTo(sender: { postMessage:Function }) {
		this.sender = sender
	}
	sendTo(sender: { postMessage:Function }) {
		this.sendMessagesTo(sender)
		return this
	}

	private receiver: { onDidReceiveMessage:Function } | undefined
	receiveMessagesFrom(receiver: { onDidReceiveMessage:Function }) {
		this.receiver = receiver
	}
	receiveFrom(receiver: { onDidReceiveMessage:Function }) {
		this.receiveMessagesFrom(receiver)
		return this
	}

	receiveFromAndSendTo(obj: { onDidReceiveMessage:Function, postMessage:Function }) {
		this.receiveMessagesFrom(obj)
		this.sendMessagesTo(obj)
		return this
	}

	private onReadyTrueCallback: (from?: string)=>any | undefined = undefined
	onReady(callback: (from?: string)=>any) {
		this.onReadyTrueCallback = callback
		return this
	}
	private onReadyFalseCallback: (from?: string)=>any | undefined = undefined
	onUnReady(callback: (from?: string)=>any) {
		this.onReadyFalseCallback = callback
		return this
	}

	subscribe(disposables?: { dispose: () => any }[]) {
		this.receiver.onDidReceiveMessage(this.onDidReceiveMessage, this, this.disposables)
		if (Array.isArray(disposables)) {
			disposables.push(this)
		}
	}

	dispose() {
		while (this.disposables.length) {
			this.disposables.pop()?.dispose()
		}
	}

	onDidReceiveMessage(message: MessengerMessage) {
		if (message.is == 'ready' && message.from === 'webview') {
			this.ready(message.payload as boolean, 'WEBVIEW')
			this.flushOnReady()
		}
		if (message.is == 'void' && message.from === 'webview') {
			try {
				let result = this.facade[message.command].apply(this.facade, [message.payload])
				if (this.errorHandler instanceof Function && typeof result == 'object' && result !== null && 'then' in result && typeof result.then == 'function') {
					result.then(() => {}, (error: any) => this.errorHandler.apply(undefined, [normaliseErr(error), message]))
				}
			} catch (error) {
				if (this.errorHandler instanceof Function) {
					this.errorHandler.apply(undefined, [normaliseErr(error), message])
				}
			}
		} else if (message.is == 'request' && message.from === 'webview') {
			this.facade[message.command].apply(this.facade, [message.payload])
				.then(responseFromFacade => {
					this.sender.postMessage({
						is: 'response',
						from: 'extension',
						requestId: message.requestId,
						payload: responseFromFacade
					})
				})
				.catch((err: any) => {
					if (this.errorHandler instanceof Function) {
						this.errorHandler.apply(undefined, [normaliseErr(err), message])
					}
					this.sender.postMessage({
						is: 'error',
						from: 'extension',
						requestId: message.requestId,
						payload: convertErrToPayload(err),
					})
				})
		}
	}

	isReady: boolean = false
	unreadyQueue: Function[] = []
	ready(isReady: boolean, from?: string) {
		this.isReady = isReady
		// console.log('isReady', this.isReady, from)
		if (this.openDeveloperToolsOnReady && isReady) {
			vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools')
		}
		if (this.onReadyTrueCallback !== undefined && isReady) {
			this.onReadyTrueCallback.apply(undefined, [from])
		}
		if (this.onReadyFalseCallback !== undefined && ! isReady) {
			this.onReadyFalseCallback.apply(undefined, [from])
		}
	}
	flushOnReady() {
		let callback = this.unreadyQueue.shift()
		while (callback) {
			// console.log('flushing...')
			callback.apply(this)
			callback = this.unreadyQueue.shift()
		}
	}
	postVoidPayload(command: string, payload: any): void {
		if (! this.isReady) {
			// console.log('queued', command)
			this.unreadyQueue.push(() => this.postVoidPayload(command, payload))
			return
		}
		// console.log('postVoidPayload', command)
		this.sender.postMessage({ is: 'void', from: 'extension', command, payload })
	}

	async postRequestPayload(command: string, payload: any): Promise<any> {
		return new Promise((resolve, reject) => {
			let requestId = ++this.requestIdSequence
			let disposable = this.receiver.onDidReceiveMessage((message: MessengerMessage) => {
				if (message.requestId === requestId && (message.is === 'response' || message.is === 'error') && message.from === 'webview') {
					this.removeListener(disposable)
					if (message.is === 'response') {
						resolve(message.payload)
					} else if (message.is === 'error') {
						reject(convertPayloadToErr(message.payload))
					}
				}
			}, this, this.disposables)
			this.sender.postMessage({ is: 'request', from: 'extension', command, payload, requestId })
		})
	}

	private removeListener(disposable: vscode.Disposable) {
		let givenDisposableIndex = this.disposables.findIndex(given => given === disposable)
		if (givenDisposableIndex > -1) {
			this.disposables[givenDisposableIndex].dispose()
			this.disposables.splice(givenDisposableIndex, 1)
		}
	}
}

export { Messenger }
export type { MessengerMessage }
