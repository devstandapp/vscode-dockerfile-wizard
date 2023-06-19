import { tick } from 'svelte'

export async function fitHeight(textareaElement: HTMLTextAreaElement, any?: any) {
	if (textareaElement) {
		await tick()
		textareaElement.style.height = 'auto'
		if (textareaElement.value.length > 0) {
			textareaElement.style.height = `${ textareaElement.scrollHeight }px`
		}
	}
}

export default function(textareaElement: HTMLTextAreaElement) {

	const fitHeightAfterTick = async () => {
		await tick()
		textareaElement.style.height = 'auto'
		if (textareaElement.value.length > 0) {
			textareaElement.style.height = `${ textareaElement.scrollHeight }px`
			clearInterval(pollInitialValueInterval)
		}
	}

	let msCallEvery = 50, msPassed = 0, msStopAfter = 2000
	let pollInitialValueInterval = setInterval(() => {
		if (textareaElement.value.length > 0) {
			fitHeightAfterTick()
		}
		msPassed += msCallEvery
		if (msPassed > msStopAfter) {
			clearInterval(pollInitialValueInterval)
		}
	}, msCallEvery)


	textareaElement.addEventListener('input', fitHeightAfterTick)

	return {
		destroy() {
			textareaElement.removeEventListener('input', fitHeightAfterTick)
			clearInterval(pollInitialValueInterval)
		}
	};
}
