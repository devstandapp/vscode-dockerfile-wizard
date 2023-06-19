import vscode from 'vscode'
import type { EditorSettings, ThemeSettings } from '../sharedTypes'

export function getEditorSettings(): EditorSettings {
	const editorConfig = vscode.workspace.getConfiguration('editor')
	const fontSize = editorConfig.get('fontSize') as number
	const { lineHeight, lineHeightFraction } = actualLineHeight(fontSize, editorConfig.get('lineHeight') as number)
	const multiCursorModifier = editorConfig.get<string>('multiCursorModifier') == 'ctrlCmd' ? 'ctrlCmd' : 'alt'

	return {
		fontSize,
		lineHeight,
		lineHeightFraction,
		multiCursorModifier,
	}
}

function actualLineHeight(fontSize: number, lineHeightSetting: number) {
	let lineHeight: number, lineHeightFraction: number
	if (lineHeightSetting < 8) {
		lineHeightFraction = (lineHeightSetting == 0) ? 1.5 : lineHeightSetting
		lineHeight = Math.round(fontSize * lineHeightFraction)
	} else {
		lineHeight = Math.round(lineHeightSetting)
		lineHeightFraction = parseFloat((lineHeight / fontSize).toFixed(1))
	}
	return { lineHeight, lineHeightFraction }
}

export function ifAffectsEditorSettingsThen(callback: () => void) {
	return (event: vscode.ConfigurationChangeEvent) => {
		if (
			event.affectsConfiguration('editor.fontSize')
			|| event.affectsConfiguration('editor.lineHeight')
			|| event.affectsConfiguration('editor.multiCursorModifier')
			|| event.affectsConfiguration('workbench.colorTheme')
		) {
			callback.call(null)
		}
	}
}


export function getThemeSettings(): ThemeSettings {
	return {
		kind: vscode.window.activeColorTheme.kind || 1
	}
}
