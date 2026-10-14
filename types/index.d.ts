export type ModelPickerCurrent = string
export type ModelPickerChoice = { hotkey: string; label: string; value: string }

declare module 'claude-code' {
  interface PluginState {
    'model-picker': { isShown: boolean; current: ModelPickerCurrent; choices: ModelPickerChoice[] }
  }
}
