<script lang="ts">
    import { phpVersion, phpVersions, baseImageName, baseImageNames, baseImageTag, baseImageTags, expandedBaseImageForm as preferenceExpanded } from '../stores/form.store'
    import iconRadio from '@vscode/codicons/src/icons/circle-filled.svg?raw'

    import PreferenceHeader from './PreferenceHeader.svelte'
</script>

<div class="flex flex-col gy-5 p-4 bg-preference outline-preference" tabindex="0">

    <PreferenceHeader bind:expanded={$preferenceExpanded}>
        {#if $preferenceExpanded} PHP version {:else} PHP version &amp; Base image {/if}
    </PreferenceHeader>

    {#if $preferenceExpanded}

        <div class="flex g-4">
            {#each phpVersions as _phpVersion (_phpVersion)}
                <div class="flex items-center -mt-1">
                    <label class="input-radio cursor-pointer">
                        <input type="radio" id={`phpVersion_${_phpVersion}`}
                            bind:group={$phpVersion}
                            value={_phpVersion}
                        >{@html iconRadio}
                    </label>
                    <label class="cursor-pointer pl-2" for={`phpVersion_${_phpVersion}`}>{_phpVersion}</label>
                </div>
            {/each}
        </div>


        {#if $baseImageNames.length}
            <div>
                <div class="color-preferenceHeader bold mb-3">Base image</div>
                <div class="flex g-4">
                    {#each $baseImageNames as _baseImageName (_baseImageName)}
                        {@const _baseImageCaption = _baseImageName == 'alpine' ? 'Alpine Linux' : _baseImageName }
                        <div class="flex items-center">
                            <label class="input-radio cursor-pointer">
                                <input type="radio" id={`baseImageName_${_baseImageName}`}
                                    bind:group={$baseImageName}
                                    value={_baseImageName}
                                >{@html iconRadio}
                            </label>
                            <label class="cursor-pointer pl-2" for={`baseImageName_${_baseImageName}`}>{_baseImageCaption}</label>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if $baseImageTags.length}
            <div>
                <div class="color-preferenceHeader bold mb-3">Base image version</div>
                <div class="flex g-4">
                    {#each $baseImageTags as _baseImageTag (_baseImageTag)}
                        <div class="flex items-center">
                            <label class="input-radio cursor-pointer">
                                <input type="radio" id={`baseImageTag_${_baseImageTag}`}
                                    bind:group={$baseImageTag}
                                    value={_baseImageTag}
                                >{@html iconRadio}
                            </label>
                            <label class="cursor-pointer pl-2" for={`baseImageTag_${_baseImageTag}`}>{_baseImageTag}</label>
                        </div>
                    {/each}
                </div>
            </div>

        {/if}


        <div class="color-dimmed sans-lh">

            Currently only <a href="https://alpinelinux.org" class="hover:color-link focus:outline underline">Alpine Linux</a> is supported.
            It is a popular, secure, lightweight distro with small image size that reduces build time and attack surface.
            Support for Ubuntu and official PHP images is in the roadmap.

        </div>

    {/if}

</div>
