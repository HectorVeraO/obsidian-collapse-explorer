# Collapse Explorer

Single-file Obsidian plugin (`main.js`, plain CommonJS, no build step, no dependencies).

- `main.js` and `manifest.json` are the shipped artifact; copy both into `<vault>/.obsidian/plugins/collapse-explorer/` to install.
- The plugin uses the file explorer's internal `tree.setCollapseAll`. Before changing it, confirm the method still exists in the installed Obsidian bundle (`%APPDATA%/obsidian/obsidian-<version>.asar`).
- On a version bump, update `manifest.json` `version` and add the entry to `versions.json` (`"<plugin version>": "<minAppVersion>"`).
- Test gate: `npm test` (`node:test`). The `obsidian` module is faked at the boundary in `test/`; never test plugin internals.
