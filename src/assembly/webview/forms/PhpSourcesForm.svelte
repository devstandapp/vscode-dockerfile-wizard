<script lang="ts">
    import { tick } from 'svelte'
    import { phpPathsForBuildText, expandedPhpSourcesForm as preferenceExpanded, expandedWritablePathsForm } from '../stores/form.store'
    import { fitHeight } from '../../../lib/webview/textareaAutogrow'
    import PreferenceHeader from './PreferenceHeader.svelte'

    let textareaElement: HTMLTextAreaElement
    $: fitHeight(textareaElement, [$phpPathsForBuildText])

    async function focusOnWritablePathsForm() {
        expandedWritablePathsForm.set(true)
        await tick()
        await tick()
        let writablePathsTextarea = document.getElementById('writablePathsText') as HTMLTextAreaElement
        if (writablePathsTextarea) {
            writablePathsTextarea.focus()
            writablePathsTextarea.scrollIntoView({ behavior: 'smooth' })
        }
    }

</script>

<div class="flex flex-col gy-4 p-4 bg-preference outline-preference" tabindex="0">

    <PreferenceHeader bind:expanded={$preferenceExpanded}>PHP sources</PreferenceHeader>

    {#if $preferenceExpanded}

        <div>
            <div class="mb-2 sans-lh">
                <span class="cursor-help underline-abbr" title="One path per each line. Each path relative to the root of the repo. Do not prefix with ./">
                Paths</span>
                containing files required to run the application. <br>
                Do not include composer's vendor directory, tests, documentation, unnecessary configs, etc.
            </div>
            <textarea class="input-text rounded mono-family lh-normal w-full" rows="2"
                bind:this={textareaElement}
                bind:value={$phpPathsForBuildText}
            ></textarea>
        </div>

        <!-- <div class="color-dimmed -mt-1">
            Configure <a href="##" on:click={focusOnWritablePathsForm} class="underline decoration-1 decoration-dashed underline-offset-2 focus:outline hover:color-link">
                writable paths</a> below
        </div> -->

    {/if}
</div>
