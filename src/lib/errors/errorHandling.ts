export function normaliseErr(err: any): Error | object {
	if (err instanceof Error) return err
	if (typeof err == 'object' && err !== null) {
		try {
			JSON.stringify(err) // checking here whether err can be stringified
			return err
		} catch (e) {
			return new Error('un-stringify-able thrown object: { '+Object.getOwnPropertyNames(err).join(', ')+' }')
		}
	}
	try {
		return new Error(err.toString())
	} catch (e) {
		return new Error()
	}
}

export function convertErrToPayload (err: any): string | object {
	let result = normaliseErr(err)
	if (result instanceof Error && 'toJson' in result && typeof result['toJson'] == 'function') {
		return (result['toJson'] as Function).apply(result)
	} else if (result instanceof Error) {
		return result.toString()
	} else {
		return result
	}
}

export function convertPayloadToErr (err: string | object): Error | object {
	try {
		if (typeof err == 'object' && err !== null) {
			if ('name' in err && ('message' in err) && err['name'] == 'ValidationError') {
				return new ValidationError((err['message'] as string), err['field'])
			} else {
				return err
			}
		} else {
			let error = new Error(err.toString())
			if (err.toString().match(/^[a-z]{1,}$/im)) {
				error.name = err.toString()
				error.message = ''
			} else {
				let matches = err.toString().match(/^(?<name>[a-z]{1,}):\s(?<message>.*)/im)
				if (matches && matches.groups && matches.groups.name && matches.groups.message) {
					error.name = matches.groups.name
					error.message = matches.groups.message
				}
			}
			return error
		}
	} catch (e) {
		return new Error()
	}
}

export class ValidationError extends Error {
	public field: string
	constructor(message: string, field: string) {
		super(message.toString())
		this.name = 'ValidationError'
		this.field = field.toString()
	}
	toJson(): object {
		return {
			name: this.name,
			message: this.message,
			field: this.field,
		}
	}
}

export class DetailedError extends Error {
	public details: string
	constructor(message: string, details: string) {
		super(message)
		this.name = 'DetailedError'
		this.details = details
	}
}

export function shouldReportError(err: any) {
	return ! (err instanceof ValidationError)
}
