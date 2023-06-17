<script lang="ts">
    import iconCheckbox from '@vscode/codicons/src/icons/check.svg?raw'
    import { nodeImages, npmRunScripts, jsBuildStage, jsBuildCommand, jsNodeImageTag, jsOutPathsText, jsPathsForBuildText, expandedJsSourcesForm as preferenceExpanded } from '../stores/form.store'
    import PreferenceHeader from './PreferenceHeader.svelte'

    import { fitHeight } from '../../../lib/webview/textareaAutogrow'
    let jsOutPathsTextareaElement: HTMLTextAreaElement
    $: fitHeight(jsOutPathsTextareaElement, [$jsOutPathsText])
    let jsPathsForBuildTextareaElement: HTMLTextAreaElement
    $: fitHeight(jsPathsForBuildTextareaElement, [$jsPathsForBuildText])

</script>

<div class="flex flex-col gy-4 p-4 bg-preference outline-preference" tabindex="0">

    <PreferenceHeader bind:expanded={$preferenceExpanded}>Frontend sources</PreferenceHeader>

    {#if $preferenceExpanded}


        <div class="inline-flex items-center mt-1">
            <label class="input-checkbox cursor-pointer">
                <input type="checkbox" id="cbx-jsBuildStage" bind:checked={$jsBuildStage}> {@html iconCheckbox}
            </label>
            <label class="cursor-pointer pl-2"
                for="cbx-jsBuildStage"
            >Build frontend with Node.js</label>
        </div>

        {#if $jsBuildStage}

            <div class="inline-flex items-center gx-2">
                <span>Node.js version</span>
                <select class="input-text pl-1 h-8 rounded"
                    bind:value={$jsNodeImageTag}>
                    {#each nodeImages as _nodeImage (_nodeImage)}
                        <option value={_nodeImage.tag}>{_nodeImage.caption}</option>
                    {/each}
                </select>
            </div>

            <div class="inline-flex items-center gx-2">
                <span>Build command</span>
                <select class="input-text pl-1 h-8 rounded mono-family"
                    bind:value={$jsBuildCommand}>
                    {#each $npmRunScripts as _script (_script)}
                        <option value={`npm run ${_script}`}>{`npm run ${_script}`}</option>
                    {/each}
                </select>
            </div>

            <div>
                <div class="mb-2 sans-lh">
                    <span class="cursor-help underline-abbr" title="One path per each line. Each path relative to the root of the repo. Do not prefix with ./">
                    Paths</span>
                    containing sources required to build frontend
                </div>
                <textarea class="input-text rounded mono-family lh-normal w-full" rows="2"
                    bind:this={jsPathsForBuildTextareaElement}
                    bind:value={$jsPathsForBuildText}
                ></textarea>
            </div>

            <div>
                <div class="mb-2 sans-lh">
                    <span class="cursor-help underline-abbr" title="One path per each line. Each path relative to the root of the repo. Do not prefix with ./">
                    Paths</span>
                    where asssets reside after frontend is built
                </div>
                <textarea class="input-text rounded mono-family lh-normal w-full" rows="2"
                    bind:this={jsOutPathsTextareaElement}
                    bind:value={$jsOutPathsText}
                ></textarea>
            </div>

        {/if}

    {/if}
</div>
