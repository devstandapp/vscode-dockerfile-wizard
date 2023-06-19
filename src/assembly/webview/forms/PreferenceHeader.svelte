<script lang="ts">
	import iconChevronRight from '@vscode/codicons/src/icons/chevron-right.svg?raw'
	import iconChevronDown from '@vscode/codicons/src/icons/chevron-down.svg?raw'
	import Icon from '../../../lib/webview/components/Icon.svelte'

	export let expanded: boolean
	function toggleExpanded() {
		expanded = ! expanded
	}
</script>

<div class="-m-4 flex">
	<div class="p-4 cursor-pointer"
		class:grow={!expanded}
		on:click={toggleExpanded}
		>
		<div class="color-preferenceHeader bold"><slot></slot></div>
	</div>
	<div class:grow={expanded}></div>
	<div class="px-4 inline-flex items-center cursor-pointer PreferenceToggleIcon"
		on:click={toggleExpanded}>
		<Icon svg={ expanded ? iconChevronDown : iconChevronRight } class="icon" />
	</div>
</div>


<style>
.color-preferenceHeader {
	color: var(--vscode-settings-headerForeground);
}
.PreferenceToggleIcon {
	visibility: hidden;
}
:global(.bg-preference:hover) .PreferenceToggleIcon,
:global(.bg-preference:focus-within) .PreferenceToggleIcon {
	visibility: visible;
}
</style>
