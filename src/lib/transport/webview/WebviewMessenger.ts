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
        if (message.is == 'void' && message.from === 'extension') {
            this.facade[message.command].apply(this.facade, [message.payload])
        } else if (message.is == 'request' && message.from === 'extension') {
            this.facade[message.command].apply(this.facade, [message.payload])
                .then(responseFromFacade => {
                    this.sender.postMessage({
                        is: 'response',
                        from: 'webview',
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
                        from: 'webview',
                        requestId: message.requestId,
                        payload: convertErrToPayload(err),
                    })
                })
        }
    }

    postVoidPayload(command: string, payload: any): void {
        this.sender.postMessage({ is: 'void', from: 'webview', command, payload })
    }

    postRequestPayload(command: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let requestId = ++this.requestIdSequence
            let responseHandler = (event: MessageEvent) => {
                let message: MessengerMessage = event.data
                if (message && message.requestId === requestId && (message.is === 'response' || message.is === 'error') && message.from === 'extension') {
                    window.removeEventListener('message', responseHandler)
                    if (message.is === 'response') {
                        resolve(message.payload)
                    } else if (message.is === 'error') {
                        reject(convertPayloadToErr(message.payload))
                    }
                }
            }
            window.addEventListener('message', responseHandler)
            this.sender.postMessage({ is: 'request', from: 'webview', command, payload, requestId })
        })
    }

    ready(isReady: boolean) {
        this.sender.postMessage({ is: 'ready', from: 'webview', payload: isReady })
    }
}

export { Messenger }
