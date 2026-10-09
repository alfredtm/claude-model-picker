import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// The choices, in the order drawn. The hotkey is the digit that picks it
// from an empty prompt; the value is what `/model <value>` takes.
const MODELS = [
  { hotkey: '1', label: 'Fable', value: 'fable' },
  { hotkey: '2', label: 'Opus', value: 'opus' },
  { hotkey: '3', label: 'Sonnet', value: 'sonnet' },
  { hotkey: '4', label: 'Haiku', value: 'haiku' },
] as const

const isShown = atom({ plugin: 'model-picker', key: 'isShown' } as const, false)
const current = atom({ plugin: 'model-picker', key: 'current' } as const, '')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pick-model',
      description: 'Show the model picker band above the prompt',
    })

    if (e.isInteractive) {
      await update($, current, () => '')
      await update($, isShown, () => true)
      void $.session.model().then(model => update($, current, () => model))
    }

    return next(e)
  })

  on('command.run', { command: 'pick-model' }, async $ => {
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
          Model{model ? `: ${model}` : ''}. Press a digit to switch, or Esc to keep it.
        </Text>
        <Box gap={1}>
          {MODELS.map(choice => (
            <Button
              key={choice.value}
              hotkey={choice.hotkey}
              label={choice.label}
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
