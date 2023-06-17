import { normaliseErr, convertErrToPayload, convertPayloadToErr } from '../../errors/errorHandling'

interface MessengerMessage {
    is: 'void' | 'request' | 'response' | 'error' | 'ready'
    from: 'webview' | 'extension'
    requestId?: number
    payload?: any
    command?: string
}

/**
 * BrowserMessenger acts as ExtensionMessenger but works inside_the_same_window as WebviewMessenger.
 * WebviewMessenger thinks it talks to ExtensionMessenger, but it actually talks to BrowserMessenger.
 * BrowserMessenger sends demo data to WebviewMessenger (the same way ExtensionMessenger does).
 * BrowserMessenger is used only in development (npm run dev) when Svelte apps are rendered in usual browser.
 */

export class BrowserMessenger {
    requestIdSequence: number = 1

    constructor() {
        this.useErrorHandler((err: Error | object) => { console.error(err) })
        this.sendMessagesTo(window)
    }

    private facade: object
    applyReceivedMessagesTo(facade: object) {
        this.facade = facade
    }

    private errorHandler: Function | undefined = undefined
    useErrorHandler(errorHandler: Function) {
        this.errorHandler = errorHandler
    }

    private sender: { postMessage:Function }
    sendMessagesTo(sender: { postMessage:Function }) {
        this.sender = sender
    }

    subscribe() {
        window.addEventListener('message', (event: MessageEvent) => this.onDidReceiveMessage(event.data))
    }

    onDidReceiveMessage(message: MessengerMessage) {
        if (message.is == 'ready' && message.from === 'webview') {
            this.ready(message.payload as boolean)
            this.flushOnReady()
        }
        if (message.is == 'void' && message.from === 'webview' && message.command == 'showMessage') {
            console.log(`%c${message.command}`, 'color:blue')
            showBrowserNotification(JSON.stringify(message.payload, null, 2))
        }
        if (message.is == 'void' && message.from === 'webview') {
            if (typeof this.facade[message.command] != 'function') {
                console.log(`%c${message.command}`, 'color:blue')
                return
            }
            this.facade[message.command].apply(this.facade, [message.payload])
        } else if (message.is == 'request' && message.from === 'webview') {
            if (typeof this.facade[message.command] != 'function') {
                console.log(`%c${message.command}`, 'color:blue')
                return
            }
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
    ready(isReady: boolean) {
        this.isReady = isReady
    }
    flushOnReady() {
        let callback = this.unreadyQueue.shift()
        while (callback) {
            callback.apply(this)
            callback = this.unreadyQueue.shift()
        }
    }

    postVoidPayload(command: string, payload: any): void {
        if (! this.isReady) {
            this.unreadyQueue.push(() => this.postVoidPayload(command, payload))
            return
        }
        this.sender.postMessage({ is: 'void', from: 'extension', command, payload })
    }

    postRequestPayload(command: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let requestId = ++this.requestIdSequence
            let responseHandler = (event: MessageEvent) => {
                let message: MessengerMessage = event.data
                if (message && message.requestId === requestId && (message.is === 'response' || message.is === 'error') && message.from === 'webview') {
                    window.removeEventListener('message', responseHandler)
                    if (message.is === 'response') {
                        resolve(message.payload)
                    } else if (message.is === 'error') {
                        reject(convertPayloadToErr(message.payload))
                    }
                }
            }
            window.addEventListener('message', responseHandler)
            this.sender.postMessage({ is: 'request', from: 'extension', command, payload, requestId })
        })
    }
}

export function showBrowserNotification(text: string) {
    if (! ('Notification' in window)) {
        alert(text)
    } else if (Notification.permission === 'granted') {
        const notification = new Notification(text)
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                const notification = new Notification(text);
            }
        })
    }
}
