<script lang="ts">
	import { dockerIgnoreText, dockerIgnoreIsExisting, appendDockerIgnoreProposedLines, expandedDockerIgnoreForm as preferenceExpanded } from '../stores/form.store'
	import { fitHeight } from '../../../lib/webview/textareaAutogrow'
	import PreferenceHeader from './PreferenceHeader.svelte'

	let textareaElement: HTMLTextAreaElement
	$: fitHeight(textareaElement, [$dockerIgnoreText])
</script>


<div class="flex flex-col gy-4 p-4 bg-preference outline-preference" tabindex="0">

	<PreferenceHeader bind:expanded={$preferenceExpanded}>Dockerignore</PreferenceHeader>

	{#if $preferenceExpanded}

		<div class="sans-lh">
			Files to exclude from the sources during build process to prevent undesired info leaks and keep container image size lightweight.

			{#if $dockerIgnoreIsExisting === true}
				<br>
				The following text is taken from <span class="mono-family">.dockerignore</span> file in your sources. <br>
				To prevent accidental bloat you could
					<a href="##" class="color-link select-none outline-none"
						on:click={()=>{ appendDockerIgnoreProposedLines() }}>
						append contents of all <span class="mono-family">.gitignore</span> files</a> found in your sources.
			{:else if $dockerIgnoreIsExisting === false}
				<br>
				The following text is generated from contents of all <span class="mono-family">.gitignore</span> files found in your sources.
			{/if}

		</div>

		<div>
			<textarea class="input-text rounded mono-family lh-normal w-full" rows="2"
				bind:this={textareaElement}
				bind:value={$dockerIgnoreText}
			></textarea>
		</div>

	{/if}
</div>
