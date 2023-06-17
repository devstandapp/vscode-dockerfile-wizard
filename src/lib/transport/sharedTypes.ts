export interface EditorSettings {
    fontSize: number
    lineHeight: number
    lineHeightFraction: number
    multiCursorModifier: 'ctrlCmd' | 'alt'
}

export function initialEditorSettings(): EditorSettings {
    return {
        fontSize:           12,   // 13,
        lineHeight:         18,   // 22,
        lineHeightFraction: 1.5,  // 1.7,
        multiCursorModifier: 'alt',
    }
}

export interface ThemeSettings {
    kind: 1 | 2 | 3 | 4     /* 1 = light, 2 = dark, 3 = dark high contrast, 4 = light high contrast */
}

export function initialThemeSettings(body?: HTMLElement): ThemeSettings {
    let kind: 1 | 2 | 3 | 4 = 1
    if (body !== undefined && (body instanceof HTMLElement)) {
        switch (body.getAttribute('data-vscode-theme-kind')) {
            case 'vscode-light':                kind = 1; break;
            case 'vscode-dark':                 kind = 2; break;
            case 'vscode-high-contrast':        kind = 3; break;
            case 'vscode-high-contrast-light':  kind = 4; break;
        }
    }
    return { kind }
}
