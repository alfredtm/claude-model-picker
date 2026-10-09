# model-picker

A [Claude Code](https://claude.com/claude-code) mod that lets you pick the model
with one keypress the moment a session opens. No more typing `/model`.

```
Model: claude-fable-5-1. Press a digit to switch.
1: Fable  2: Opus  3: Sonnet  4: Haiku  0: Keep
```

Press a digit on the empty prompt and the mod runs `/model <alias>` for you.
Press `0` to keep what you have. The band goes away either way.

## Install

At the prompt of a terminal session:

```
/plugin install model-picker --marketplace alfredtm/claude-model-picker
```

Answer `y` to add the marketplace, then pick a scope (user is the usual one).
The mod is active right away and in every session after.

## Use

- The band appears above the prompt on every interactive start.
- `1` to `4` switch the model. `0` keeps the current one.
- `/pick-model` brings the band back later in the session.

Headless runs (`claude -p`) never show it.

## Customise

The choices live in one list at the top of `hooks/register.tsx`:

```ts
const MODELS = [
  { hotkey: '1', label: 'Fable', value: 'fable' },
  { hotkey: '2', label: 'Opus', value: 'opus' },
  ...
]
```

`value` is whatever `/model` accepts: an alias like `opus` or a full model id.

## Develop

Run it from a checkout without installing:

```
claude --plugin-dir /path/to/claude-model-picker
```

Edits to the hooks module hot-reload in that session. Check and test with:

```
claude plugin validate .
claude plugin test .
```

After the mod has loaded once, `tsc -p .` type-checks it against the
declarations Claude Code lays down in `.claude-plugin/types/`.

## License

MIT
