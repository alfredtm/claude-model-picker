import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { CommandRunInput, On, RenderPropsOf } from 'claude-code'

const BAND: RenderPropsOf['AbovePrompt'] = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
}

const SURFACES = ['terminal', 'desktop'] as const

// `/pick-model` as the person types it at the prompt.
const PICK: CommandRunInput = {
  command: 'pick-model',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 100 },
}

// The world beneath the mod: a session on Fable, a registry that accepts
// the command, and a `/model` that records what it was asked for.
const world = (on: On, ran: string[]) => {
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.model', () => ({ value: 'claude-fable-5-1' }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  // The engine's own empty band, drawn when the mod passes the ask on.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('command.run', { command: 'model' }, (_$, e) => {
    ran.push(e.args)
    return { text: `Set model to ${e.args}` }
  })
}

const start = ($: Engine) =>
  $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })

test('shows the picker above the prompt on an interactive start', async ($, on) => {
  world(on, [])
  await start($)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'model-picker', surface, component: 'AbovePrompt', props: BAND })
    const buttons = await ui.findAll({ type: 'Button' })
    expect(buttons.map(b => b.key)).toEqual(['fable', 'opus', 'sonnet', 'haiku', 'keep'])
    expect((await ui.find({ type: 'Text' }))?.text).toContain('claude-fable-5-1')
    await ui.unmount()
  }
})

test('leaves the model alone on start when no default is set', async ($, on) => {
  const ran: string[] = []
  world(on, ran)
  await start($)

  expect(ran).toEqual([])
})

test('applies the default model on an interactive start', { options: { defaultModel: 'opus' } }, async ($, on) => {
  const ran: string[] = []
  world(on, ran)
  await start($)

  expect(ran).toEqual(['opus'])

  // The band still shows, with the default marked, so a press can override it.
  const ui = await $.ui.mount({ plugin: 'model-picker', surface: 'terminal', component: 'AbovePrompt', props: BAND })
  expect((await ui.find({ key: 'opus' }))?.props.label).toBe('Opus (default)')
  expect((await ui.find({ type: 'Text' }))?.text).toContain('opus')
  await ui.press({ key: 'sonnet' })
  expect(ran).toEqual(['opus', 'sonnet'])
})

test('does not apply the default on a headless start', { options: { defaultModel: 'opus' } }, async ($, on) => {
  const ran: string[] = []
  world(on, ran)
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })

  expect(ran).toEqual([])
})

test('stays quiet on a headless start', async ($, on) => {
  world(on, [])
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })

  const ui = await $.ui.mount({ plugin: 'model-picker', surface: 'terminal', component: 'AbovePrompt', props: BAND })
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
})

test('a press runs /model with the alias and hides the band', async ($, on) => {
  const ran: string[] = []
  world(on, ran)
  await start($)

  for (const surface of SURFACES) {
    ran.length = 0
    await $.command.run(PICK)
    const ui = await $.ui.mount({ plugin: 'model-picker', surface, component: 'AbovePrompt', props: BAND })
    await ui.press({ key: 'opus' })

    expect(ran).toEqual(['opus'])
    expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
    await ui.unmount()
  }
})

test('keep hides the band without switching', async ($, on) => {
  const ran: string[] = []
  world(on, ran)
  await start($)

  const ui = await $.ui.mount({ plugin: 'model-picker', surface: 'terminal', component: 'AbovePrompt', props: BAND })
  await ui.press({ key: 'keep' })

  expect(ran).toEqual([])
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
})

test('/pick-model brings the band back', async ($, on) => {
  world(on, [])
  await start($)

  const ui = await $.ui.mount({ plugin: 'model-picker', surface: 'terminal', component: 'AbovePrompt', props: BAND })
  await ui.press({ key: 'keep' })
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)

  const { text } = await $.command.run(PICK)
  expect(text).toContain('shown')
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(5)
})
