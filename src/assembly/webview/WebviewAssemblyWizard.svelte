<script lang="ts">
    import { onMount } from 'svelte'
    import { messengerReady, extension } from './transport'
    onMount(()=>{ messengerReady(true) })

    import iconCheckbox from '@vscode/codicons/src/icons/check.svg?raw'

    import { saveEnabled, ghaCreate } from './stores/form.store'
    import { detected } from './stores/report.store'

    import NotDetected from './NotDetected.svelte'
    import AssemblyForm from './forms/AssemblyForm.svelte'

</script>

<div class="px-6 py-4" style="max-width:710px;">


    {#if $detected === undefined}
        <!-- waiting for report... -->
    {:else if $detected === false}

        <NotDetected />

    {:else}

        <AssemblyForm />


        {#if $saveEnabled }
            <div class="px-4 pt-8">
                <div class="inline-flex items-center">
                    <label class="input-checkbox cursor-pointer">
                        <input type="checkbox" id="ghaCreate"
                            bind:checked={$ghaCreate}
                        >{@html iconCheckbox}
                    </label>
                    <label class="cursor-pointer pl-2" for="ghaCreate">
                        Also create GitHub Actions workflow file
                    </label>
                </div>
            </div>
        {/if}

        <div class="p-4 mb-8 inline-flex items-center gx-4">
            <button class="button select-none"
                class:opacity-25={! $saveEnabled}
                class:cursor-not-allowed={! $saveEnabled}
                disabled={! $saveEnabled}
                on:click={()=>{ if ($saveEnabled) { extension.onWizardRequestedSave({ ghaCreate: $ghaCreate }) } }}
                >Create Dockerfile</button>

            <button class="button button-secondary select-none"
                class:opacity-25={! $saveEnabled}
                class:cursor-not-allowed={! $saveEnabled}
                disabled={! $saveEnabled}
                on:click={()=>{ if ($saveEnabled) { extension.onWizardRequestedPreview() } }}
                >Preview</button>

        </div>

    {/if}

</div>
