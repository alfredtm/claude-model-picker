export type ModelPickerCurrent = string

declare module 'claude-code' {
  interface PluginState {
    'model-picker': { isShown: boolean; current: ModelPickerCurrent }
  }
}
