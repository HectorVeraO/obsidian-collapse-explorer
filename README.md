# Collapse Explorer

Obsidian plugin that adds one command, **Collapse Explorer: Collapse all folders**, so the file explorer's "Collapse all" button can be bound to a hotkey. Obsidian has no built-in command for it.

## Install

1. Create `<vault>/.obsidian/plugins/collapse-explorer/`.
2. Copy `main.js` and `manifest.json` into it.
3. Restart Obsidian and enable **Collapse Explorer** in Settings -> Community plugins.
4. Bind a key in Settings -> Hotkeys, or add this to `<vault>/.obsidian/hotkeys.json`:

```json
"collapse-explorer:collapse-all": [{ "modifiers": ["Alt"], "key": "C" }]
```

## How it works

The command calls the explorer's internal `tree.setCollapseAll(true)`, the same call behind its nav button. That is not public API: if an Obsidian update removes it, the command shows a notice instead of failing silently. Tested against Obsidian 1.14.4.

## Development

```sh
npm test
```

Tests run with `node:test` and replace the `obsidian` module with a fake that mirrors the explorer tree's behavior. No dependencies to install.

## License

[MIT](LICENSE)
