<script lang="ts">
	import { writablePathsText, expandedWritablePathsForm as preferenceExpanded } from '../stores/form.store'
	import { fitHeight } from '../../../lib/webview/textareaAutogrow'
	import PreferenceHeader from './PreferenceHeader.svelte'

	let textareaElement: HTMLTextAreaElement
	$: fitHeight(textareaElement, [$writablePathsText])
</script>

<div class="flex flex-col gy-4 p-4 bg-preference outline-preference" tabindex="0">
	<PreferenceHeader bind:expanded={$preferenceExpanded}>Writable paths</PreferenceHeader>

	{#if $preferenceExpanded}
		<div class="sans-lh">
			Grant the application process write permissions to these
			<span class="cursor-help underline-abbr" title="One path per each line. Each path relative to the root of the repo. Do not prefix with ./">paths</span>
			. Think of directories where parsed view templates, caches, logs and temporary file uploads are stored in local filesystem.
		</div>

		<div>
			<textarea class="input-text rounded mono-family lh-normal w-full" rows="2" id="writablePathsText" bind:this={textareaElement} bind:value={$writablePathsText} />
		</div>
	{/if}
</div>
