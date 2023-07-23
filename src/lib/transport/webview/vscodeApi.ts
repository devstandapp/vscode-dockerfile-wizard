interface VsCodeApiInterface {
	postMessage: (d: any) => void
	getState: () => object | undefined
	setState: (data: object) => void
}

class VsCodeApi implements VsCodeApiInterface {
	private acquired: boolean
	private api: VsCodeApiInterface
	constructor() {
		// @ts-ignore
		if (typeof acquireVsCodeApi == 'function') {
			this.acquired = true
			// @ts-ignore
			this.api = acquireVsCodeApi()
		} else {
			this.acquired = false
		}
	}
	postMessage(data: any) {
		this.acquired ? this.api.postMessage(data) : window.postMessage(data)
	}
	getState<T extends object>(): T | undefined {
		if (this.acquired) {
			return this.api.getState() as T | undefined
		} else {
			try {
				return JSON.parse(window.sessionStorage.getItem('VsCodeApiState')) as T | undefined
			} catch (e) {
				return undefined
			}
		}
	}
	setState<T extends object>(data: T) {
		if (this.acquired) {
			this.api.setState(data)
		} else {
			window.sessionStorage.setItem('VsCodeApiState', JSON.stringify(data))
		}
	}
}

export default new VsCodeApi()
