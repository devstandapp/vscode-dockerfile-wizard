<script lang="ts">
	import iconCheckbox from '@vscode/codicons/src/icons/check.svg?raw'
	import PreferenceHeader from './PreferenceHeader.svelte'

	import { phpModulesAll, phpModulesChecked, baseImage, expandedPhpModulesForm as preferenceExpanded } from '../stores/form.store'
	import { phpModulesFromPackageJsonCbx, phpModulesFromRequiredPackagesCbx, phpModulesRecommendedByFrameworkCbx, expandedCheckedPhpModules, toggleSingleModule } from '../stores/form.store'
	import {
		phpModulesManuallyAdded,
		phpModulesManuallyAddedToView,
		phpModulesFromPackageJsonExcluded,
		phpModulesFromPackageJsonCbxIndeterminate,
		phpModulesFromRequiredPackagesExcluded,
		phpModulesFromRequiredPackagesCbxIndeterminate,
		phpModulesRecommendedByFrameworkExcluded,
		phpModulesRecommendedByFrameworkCbxIndeterminate,
	} from '../stores/form.store'
	import { phpReport } from '../stores/report.store'

	function onSingleModuleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		toggleSingleModule(event.currentTarget.value, event.currentTarget.checked)
	}
</script>

<div class="flex flex-col gy-4 p-4 bg-preference outline-preference" tabindex="0">
	<PreferenceHeader bind:expanded={$preferenceExpanded}>PHP modules</PreferenceHeader>

	{#if $preferenceExpanded}
		<div class="flex gx-2">
			<div>
				<label class="input-checkbox cursor-not-allowed">
					<input type="checkbox" checked disabled id="phpModulesBuiltinCbx" />
					{@html iconCheckbox}
				</label>
			</div>
			<div class="sans-lh">
				<label class="cursor-pointer" for="phpModulesBuiltinCbx">
					Builtin modules preinstalled with PHP {$baseImage.phpVersion} in {$baseImage.baseImageName}
					{$baseImage.baseImageTag}
				</label>
				<div>
					<div class="inline-flex flex-wrap gx-2">
						{#each $baseImage.phpModulesBuiltin as phpModuleName} <span class="mono-family color-dimmed">{phpModuleName}</span> {/each}
					</div>
				</div>
			</div>
		</div>

		{#if $phpReport.phpModulesFromPackageJson.length}
			<div class="flex gx-2">
				<div>
					<label class="input-checkbox cursor-pointer">
						<input type="checkbox" id="phpModulesFromPackageJsonCbx" bind:checked={$phpModulesFromPackageJsonCbx} indeterminate={$phpModulesFromPackageJsonCbxIndeterminate} />
						{@html iconCheckbox}
					</label>
				</div>
				<div class="sans-lh">
					<label class="cursor-pointer" for="phpModulesFromPackageJsonCbx">
						Modules explicitly mentioned in <span class="mono-family">require</span>
						portion of
						<span class="mono-family">package.json</span>
					</label>
					<div>
						<div class="inline-flex flex-wrap gx-2">
							{#each $phpReport.phpModulesFromPackageJson as phpModuleName}
								<span
									class="mono-family"
									class:color-dimmed={$baseImage.phpModulesBuiltin.includes(phpModuleName)}
									class:decoration-strike={$phpModulesFromPackageJsonExcluded.includes(phpModuleName)}
								>
									{phpModuleName}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if $phpReport.phpModulesFromRequiredPackages.length}
			<div class="flex gx-2">
				<div>
					<label class="input-checkbox cursor-pointer">
						<input type="checkbox" id="phpModulesFromRequiredPackages" bind:checked={$phpModulesFromRequiredPackagesCbx} indeterminate={$phpModulesFromRequiredPackagesCbxIndeterminate} />
						{@html iconCheckbox}
					</label>
				</div>
				<div class="sans-lh">
					<label class="cursor-pointer" for="phpModulesFromRequiredPackages">
						Modules required by composer dependencies required in <span class="mono-family">package.json</span>
					</label>
					<div>
						<div class="inline-flex flex-wrap gx-2">
							{#each $phpReport.phpModulesFromRequiredPackages as phpModule}
								<span
									class="mono-family decoration-error decoration-2"
									class:color-dimmed={$baseImage.phpModulesBuiltin.includes(phpModule.module)}
									class:decoration-strike={$phpModulesFromRequiredPackagesExcluded.includes(phpModule.module)}
								>
									{phpModule.module}
								</span>
								<!-- {#each phpModule.related as related}
									<span class="color-dimmed">({related.dependency} {related.note || '' })</span>
								{/each} -->
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if $phpReport.phpModulesRecommendedByFramework.length}
			<div class="flex gx-2">
				<div>
					<label class="input-checkbox cursor-pointer">
						<input type="checkbox" id="phpModulesRecommendedByFramework" bind:checked={$phpModulesRecommendedByFrameworkCbx} indeterminate={$phpModulesRecommendedByFrameworkCbxIndeterminate} />
						{@html iconCheckbox}
					</label>
				</div>
				<div class="sans-lh">
					<label class="cursor-pointer" for="phpModulesRecommendedByFramework">Modules recommended for the framework</label>
					<div>
						<div class="inline-flex flex-wrap gx-2">
							{#each $phpReport.phpModulesRecommendedByFramework as phpModule}
								<span
									class="mono-family decoration-warning decoration-2"
									class:color-dimmed={$baseImage.phpModulesBuiltin.includes(phpModule.module)}
									class:decoration-strike={$phpModulesRecommendedByFrameworkExcluded.includes(phpModule.module)}
								>
									{phpModule.module}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if !$expandedCheckedPhpModules && $phpModulesManuallyAddedToView.length}
			<div class="flex gx-2">
				<div>
					<label class="input-checkbox cursor-pointer">
						<input
							type="checkbox"
							id="phpModulesManuallyAdded"
							checked={$phpModulesManuallyAdded.length > 0}
							on:input={event => {
								if (!event.currentTarget.checked) {
									phpModulesManuallyAdded.set([])
								}
							}}
						/>
						{@html iconCheckbox}
					</label>
				</div>
				<div class="sans-lh">
					<label class="cursor-pointer" for="phpModulesManuallyAdded">Manually selected modules</label>
					<div>
						<div class="inline-flex flex-wrap gx-2">
							{#each $phpModulesManuallyAddedToView as phpModuleName}
								<span class="mono-family">{phpModuleName}</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if $expandedCheckedPhpModules}
			<div class="pl-8 pt-2 ModulesColumns">
				{#each $phpModulesAll as phpModuleName}
					{@const isBuiltin = $baseImage.phpModulesBuiltin.includes(phpModuleName)}
					{@const isFromPackageJson = $phpReport.phpModulesFromPackageJson.includes(phpModuleName)}
					{@const requiredByPackages = $phpReport.phpModulesFromRequiredPackages.find(d => d.module == phpModuleName)?.related.map(r => r.dependency) || []}
					{@const recommendedByFrameworkNotes = $phpReport.phpModulesRecommendedByFramework.find(d => d.module == phpModuleName)?.related.map(r => r.note) || []}
					<div class="mb-2">
						<div class="inline-flex items-center">
							<label class="input-checkbox cursor-pointer">
								<input type="checkbox" value={phpModuleName} checked={$phpModulesChecked.includes(phpModuleName)} on:click={onSingleModuleClick} id={`cbx-${phpModuleName}`} disabled={isBuiltin} />
								{@html iconCheckbox}
							</label>

							<label class="mono-family cursor-pointer pl-2" class:color-dimmed={isBuiltin} for={`cbx-${phpModuleName}`}>{phpModuleName}</label>

							{#if isFromPackageJson || requiredByPackages.length || recommendedByFrameworkNotes.length}
								{@const isFromPackageJsonText = isFromPackageJson ? 'Explicitly mentioned in composer.json' : ''}
								{@const requiredByPackagesText = requiredByPackages.length ? `Required by dependencies: ${requiredByPackages.join(', ')}` : ''}
								{@const recommendedByFrameworkNotesText = recommendedByFrameworkNotes.length ? `Recommended for ${recommendedByFrameworkNotes.join(', ')}` : ''}
								<span
									class="icon bold sans-lh-loose cursor-help ml-2"
									class:color-dimmed={isBuiltin}
									class:color-error={(isFromPackageJson || requiredByPackages.length) && !isBuiltin}
									class:color-warning={recommendedByFrameworkNotesText && !(isFromPackageJson || requiredByPackages.length) && !isBuiltin}
									title={[isFromPackageJsonText, requiredByPackagesText, recommendedByFrameworkNotesText].filter(t => t).join('; ')}
								>
									*
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="pl-8">
			<a
				href="##"
				class="sans-lh color-link select-none focus:outline"
				on:click={() => {
					$expandedCheckedPhpModules = !$expandedCheckedPhpModules
				}}
			>
				{$expandedCheckedPhpModules ? 'Hide modules list' : 'Manually select PHP modules'}
			</a>
		</div>
	{/if}
</div>

<style>
	.ModulesColumns {
		columns: 1;
	}
	@media (min-width: 400px) {
		.ModulesColumns {
			columns: 2;
		}
	}
	@media (min-width: 550px) {
		.ModulesColumns {
			columns: 3;
		}
	}
	@media (min-width: 700px) {
		.ModulesColumns {
			columns: 4;
		}
	}
	/* @media (min-width: 850px)  { .ModulesColumns { columns: 5; } } */
</style>
