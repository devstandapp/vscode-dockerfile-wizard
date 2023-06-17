import { derived, writable } from 'svelte/store'
import type { EditorSettings, ThemeSettings } from '../../../lib/transport/sharedTypes'
import { initialEditorSettings, initialThemeSettings } from '../../../lib/transport/sharedTypes'


export const themeSettings = writable<ThemeSettings>(initialThemeSettings(document.body))

export const themeIsDark = derived(themeSettings, ($ts) => ($ts.kind == 2 || $ts.kind == 3), false)



export const editorSettings = writable<EditorSettings>(initialEditorSettings())

const gridSizeShouldBeEven = false
export const gridSize = derived(editorSettings, ($es) => {
    return (gridSizeShouldBeEven && $es.lineHeight % 2 != 0)
        ? $es.lineHeight + 1
        : $es.lineHeight
}, 18)

function cssVariable(key: string, value: number | string) {
    document.documentElement.style.setProperty(`--${key}`, value.toString())
}
editorSettings.subscribe($es => {
    let quaterFontSize = Math.floor($es.fontSize / 4)
    let halfFontSize = Math.floor($es.fontSize / 2)
    cssVariable('fs1', quaterFontSize)
    cssVariable('fs2', halfFontSize)
    cssVariable('fs3', $es.fontSize - quaterFontSize)
    cssVariable('fs4', $es.fontSize)
    cssVariable('lh',  $es.lineHeight)
})
gridSize.subscribe($gs => {
    let quaterGridSize = Math.floor($gs / 4)
    let halfGridSize = Math.floor($gs / 2)
    cssVariable('gs1', quaterGridSize)
    cssVariable('gs2', halfGridSize)
    cssVariable('gs3', $gs - quaterGridSize)
    cssVariable('gs4', $gs)

    cssVariable('knobSize', $gs > 20 ? 18 : 16)
})
