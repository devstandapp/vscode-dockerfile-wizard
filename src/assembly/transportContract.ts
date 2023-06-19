import type { EditorSettings, ThemeSettings } from '../lib/transport/sharedTypes'
import type { AssemblyFormResult, RepositoryReport } from './sharedTypes'

export interface DomainInterface {
	showMessage(payload: { message: string, error?: boolean, detail?: string }): void
	getRepositoryReport(fresh?: boolean): Promise<RepositoryReport>
	formResultChanged(payload: AssemblyFormResult | undefined): void
	onWizardRequestedSave(payload?: { ghaCreate: boolean }): void
	onWizardRequestedPreview(): void
}

export interface WebviewInterface {
	editorSettings(payload: EditorSettings): void
	themeSettings(payload: ThemeSettings): void
	getFormResult(): Promise<AssemblyFormResult | undefined>
}
