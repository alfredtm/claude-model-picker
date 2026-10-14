import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { BUILT_INS, choicesFromSettings } from './choices'

const isShown = atom({ plugin: 'model-picker', key: 'isShown' } as const, false)
const current = atom({ plugin: 'model-picker', key: 'current' } as const, '')
const choices = atom({ plugin: 'model-picker', key: 'choices' } as const, BUILT_INS)

// The band's models from the settings file: the built-ins plus the
// model rows its modelPicker carries — the same rows /model shows, so
// whatever keeps them there (a hand-edited lineup, intility-inference
// with the GLM models) rides the band with a digit each. Read once a
// session and on /pick-model, never on render — that happens at every
// prompt. A fault leaves the band exactly as it was.
async function readChoices($: EngineInterface): Promise<void> {
  try {
    const home = await $.env.get('HOME')
    if (home === undefined) return
    const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${home}/.claude`
    const text = await $.fs.read(`${dir}/settings.json`)
    await update($, choices, () => choicesFromSettings(text))
  } catch {}
}

export const register: Register = (on, options) => {
  // The `defaultModel` option from /config (or settings.json `pluginConfigs`):
  // what `/model` is run with on every interactive start. Empty means leave
  // the session on whatever it opened with.
  const defaultModel = typeof options.defaultModel === 'string' ? options.defaultModel.trim() : ''

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pick-model',
      description: 'Show the model picker band above the prompt',
    })

    if (e.isInteractive) {
      await readChoices($)
      await update($, current, () => '')
      await update($, isShown, () => true)

      if (defaultModel) {
        try {
          await $.command.run({ command: 'model', args: defaultModel })
        } catch (error) {
          $.ui.toast(`model-picker: default model ${defaultModel}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      void $.session.model().then(model => update($, current, () => model))
    }

    return next(e)
  })

  on('command.run', { command: 'pick-model' }, async $ => {
    await readChoices($)
    const model = await $.session.model()
    await update($, current, () => model)
    await update($, isShown, () => true)

    return { text: 'Model picker shown above the prompt.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isShown))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const model = await read($, current)

    const pick = async (value: string) => {
      await update($, isShown, () => false)
      try {
        await $.command.run({ command: 'model', args: value })
      } catch (error) {
        $.ui.toast(`model-picker: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return (
      <Box flexDirection="column">
        <Text dimColor>
          Model{model ? `: ${model}` : ''}.
          {defaultModel ? ` Default on start: ${defaultModel}.` : ''} Press a digit to switch.
        </Text>
        <Box gap={1}>
          {(await read($, choices)).map(choice => (
            <Button
              key={choice.value}
              hotkey={choice.hotkey}
              label={choice.value === defaultModel ? `${choice.label} (default)` : choice.label}
              plain
              onPress={() => void pick(choice.value)}
            />
          ))}
          <Button
            key="keep"
            hotkey="0"
            label="Keep"
            plain
            dimColor
            onPress={() => void update($, isShown, () => false)}
          />
        </Box>
      </Box>
    )
  })
}
