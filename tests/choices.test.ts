import { expect, test } from 'claude-code/testing'

import { BUILT_INS, choicesFromSettings } from '../hooks/choices'

const BUILT_IN_VALUES = BUILT_INS.map(c => c.value)

test('no settings, or settings that are not an object: the built-ins', () => {
  expect(choicesFromSettings(undefined).map(c => c.value)).toEqual(BUILT_IN_VALUES)
  expect(choicesFromSettings('not json').map(c => c.value)).toEqual(BUILT_IN_VALUES)
  expect(choicesFromSettings('[]').map(c => c.value)).toEqual(BUILT_IN_VALUES)
  expect(choicesFromSettings('null').map(c => c.value)).toEqual(BUILT_IN_VALUES)
  expect(choicesFromSettings('{}').map(c => c.value)).toEqual(BUILT_IN_VALUES)
  expect(choicesFromSettings('{"modelPicker":"no"}').map(c => c.value)).toEqual(BUILT_IN_VALUES)
  expect(choicesFromSettings('{"modelPicker":{"options":"no"}}').map(c => c.value)).toEqual(BUILT_IN_VALUES)
})

test('rows join the built-ins, deduped, hotkeys in draw order', () => {
  const choices = choicesFromSettings(JSON.stringify({
    modelPicker: {
      options: [
        { model: 'glm-5-3', label: 'GLM' },
        { model: 'glm-5-3' },        // the same value twice — dropped
        { model: 'opus' },            // a built-in again — dropped
        { model: '' },                // no model — dropped
        { label: 'no model here' },   // dropped
        {},                           // dropped
      ],
    },
  }))
  expect(choices.map(c => c.value)).toEqual([...BUILT_IN_VALUES, 'glm-5-3'])
  expect(choices.map(c => c.hotkey)).toEqual(['1', '2', '3', '4', '5'])
})

test('a row without a label shows its model id', () => {
  const choice = choicesFromSettings(JSON.stringify({ modelPicker: { options: [{ model: 'glm-5-3' }] } })).find(c => c.value === 'glm-5-3')
  expect(choice?.label).toBe('glm-5-3')
})

test('replaceBuiltInOptions: the rows alone — and never an empty band', () => {
  const rows = JSON.stringify({ modelPicker: { replaceBuiltInOptions: true, options: [{ model: 'glm-5-3', label: 'GLM' }] } })
  expect(choicesFromSettings(rows).map(c => c.value)).toEqual(['glm-5-3'])

  const empty = JSON.stringify({ modelPicker: { replaceBuiltInOptions: true, options: [] } })
  expect(choicesFromSettings(empty).map(c => c.value)).toEqual(BUILT_IN_VALUES)
})
