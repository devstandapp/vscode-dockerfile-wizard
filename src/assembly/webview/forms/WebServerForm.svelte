<script lang="ts">
	import { serverPort, serverRequestSize, documentRoot, frontController, expandedWebServerForm as preferenceExpanded } from '../stores/form.store'
	import PreferenceHeader from './PreferenceHeader.svelte'
</script>

<div class="flex flex-col gy-4 p-4 bg-preference outline-preference" tabindex="0">

	<PreferenceHeader bind:expanded={$preferenceExpanded}>Web server</PreferenceHeader>

	{#if $preferenceExpanded}

		<div class="color-dimmed sans-lh">
			Currently only <a href="https://unit.nginx.org" class="hover:color-link focus:outline underline">Nginx Unit</a> is supported.
			Support for Swoole/Octane is in the roadmap.
		</div>

		<div>
			<div class="mb-2 sans-lh">Listen HTTP traffic on port</div>
			<div class="inline-flex items-center gx-2">
				<input type="number" class="input-text rounded mono-family w-28"
					bind:value={$serverPort}
					min="1025"
				/>
				<span
					class:color-error={$serverPort <= 1024}
					class:color-dimmed={$serverPort > 1024}
					>
						unprivileged port (value greater than 1024) is mandatory for
						<span class="cursor-help underline-abbr" title="Container images that can be run without root privileges, providing a more secure and isolated sandbox">
							rootless images</span>
				</span>
			</div>
		</div>

		<div>
			<div class="mb-2 sans-lh">Maximum size of a file upload or a POST request</div>
			<div class="inline-flex items-center gx-2">
				<input type="number" class="input-text rounded mono-family w-20"
					bind:value={$serverRequestSize}
					min="1"
				/>
				<span class="color-dimmed">Megabytes</span>
			</div>
		</div>

		<div class="flex gx-4">
			<div>

				<div class="mb-2 sans-lh">Document root</div>
				<input type="text" class="input-text rounded mono-family"
					bind:value={$documentRoot}
				/>

			</div>
			<div>

				<div class="mb-2 sans-lh">Front controller</div>
				<input type="text" class="input-text rounded mono-family"
					bind:value={$frontController}
				/>

			</div>
		</div>

		<div class="color-dimmed sans-lh">
			Once a Dockerfile is generated you can manually fine tune
			<a href="https://unit.nginx.org/configuration/" class="hover:color-link focus:outline underline">Nginx Unit configuration</a>
		</div>

	{/if}
</div>
