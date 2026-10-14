// choices.ts — the band's models, chosen.
//
// The built-ins are the mod's own four. Beside them go the model rows
// the user keeps in settings.json's modelPicker — the same rows /model
// shows, whatever wrote them: a hand-edited lineup, or a mod that
// maintains one (intility-inference keeps the GLM models there, so
// they land on the band beside the Claude ones, a digit each). Pure:
// the settings text comes in, the choice list goes out; the file is
// read in register.tsx.

export interface Choice {
  hotkey: string
  label: string
  value: string
}

// The four the band always had, in the order drawn.
export const BUILT_INS: Choice[] = [
  { hotkey: '1', label: 'Fable', value: 'fable' },
  { hotkey: '2', label: 'Opus', value: 'opus' },
  { hotkey: '3', label: 'Sonnet', value: 'sonnet' },
  { hotkey: '4', label: 'Haiku', value: 'haiku' },
]

// The digits run out at nine — 0 keeps the model — so the band cannot
// hold more than nine choices.
const MAX = 9

// The choice list a settings.json's text makes: the built-ins plus its
// model rows — the rows alone when they replace the built-ins —
// deduped by value, capped at nine, hotkeys in draw order. Text that
// is missing, not JSON, or not an object leaves the built-ins alone: a
// settings file the mod cannot read is not one it has an opinion
// about.
export function choicesFromSettings(text: string | undefined): Choice[] {
  let settings: unknown
  try {
    settings = text === undefined ? undefined : JSON.parse(text)
  } catch {
    return BUILT_INS
  }
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) return BUILT_INS

  const picker = (settings as { modelPicker?: unknown }).modelPicker
  if (typeof picker !== 'object' || picker === null || Array.isArray(picker)) return BUILT_INS

  const rows = (picker as { options?: unknown }).options
  const replace = (picker as { replaceBuiltInOptions?: unknown }).replaceBuiltInOptions === true
  if (!Array.isArray(rows)) return BUILT_INS

  const seen = new Set(BUILT_INS.map(c => c.value))
  const extra: Choice[] = []
  for (const row of rows) {
    const model = (row as { model?: unknown } | null)?.model
    if (typeof model !== 'string' || model === '' || seen.has(model)) continue
    seen.add(model)
    const label = (row as { label?: unknown })?.label
    extra.push({ hotkey: '', label: typeof label === 'string' && label !== '' ? label : model, value: model })
  }

  const list = [...(replace ? [] : BUILT_INS), ...extra].slice(0, MAX)
  // never an empty band — a lineup that replaces the built-ins with
  // nothing it can read is not one to follow into silence
  return list.length > 0 ? list.map((c, i) => ({ ...c, hotkey: String(i + 1) })) : BUILT_INS
}
