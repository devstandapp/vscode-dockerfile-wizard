<script lang="ts">
    import { baseImage } from '../stores/form.store'
    import { phpReport, jsReport, containerReport } from '../stores/report.store'

    import BaseImageForm from './BaseImageForm.svelte'
    import PhpModulesForm from './PhpModulesForm.svelte'
    import PhpSourcesForm from './PhpSourcesForm.svelte'
    import WritablePathsForm from './WritablePathsForm.svelte'
    import DockerIgnoreForm from './DockerIgnoreForm.svelte'
    import JsSourcesForm from './JsSourcesForm.svelte'
    import WebServerForm from './WebServerForm.svelte'

</script>

<div class="flex flex-col">

    <BaseImageForm />

    {#if $baseImage !== undefined}

        {#if $phpReport !== undefined}

            <PhpModulesForm />

            <WebServerForm />

            <PhpSourcesForm />

        {/if}


        {#if $jsReport !== undefined}

            <JsSourcesForm />

        {/if}


        <WritablePathsForm />


        {#if $containerReport !== undefined}

            <DockerIgnoreForm />

        {/if}

    {/if}

</div>
