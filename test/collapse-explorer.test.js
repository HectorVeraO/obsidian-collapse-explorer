'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const { beforeEach, describe, it } = require('node:test');

const notices = [];

// Obsidian is the boundary: the plugin only runs inside the app, so the
// `obsidian` module is replaced with the minimal surface the plugin touches.
const fakeObsidian = {
  Notice: class {
    constructor(message) {
      notices.push(message);
    }
  },
  Plugin: class {
    constructor(app) {
      this.app = app;
      this.commands = [];
    }

    addCommand(command) {
      this.commands.push(command);
    }
  },
};

const originalLoad = Module._load;
Module._load = function loadWithFakeObsidian(request, parent, isMain) {
  if (request === 'obsidian') {
    return fakeObsidian;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const CollapseExplorerPlugin = require('../main.js');
Module._load = originalLoad;

/**
 * Mirrors the file explorer tree's observable semantics: setCollapseAll is a
 * no-op while its cached flag already matches, and expanding a folder by hand
 * does not reset that flag.
 */
function createExplorerTree(folderNames) {
  const folders = folderNames.map((name) => ({ name, collapsed: false }));
  return {
    folders,
    isAllCollapsed: false,
    setCollapseAll(collapsed) {
      if (this.isAllCollapsed === collapsed) {
        return;
      }
      this.isAllCollapsed = collapsed;
      for (const folder of folders) {
        folder.collapsed = collapsed;
      }
    },
    expandByHand(name) {
      const folder = folders.find((candidate) => candidate.name === name);
      assert.ok(folder, `unknown folder ${name}`);
      folder.collapsed = false;
    },
  };
}

function createApp(views) {
  return {
    workspace: {
      getLeavesOfType(viewType) {
        const leaves = viewType === 'file-explorer' ? views.map((view) => ({ view })) : [];
        return leaves;
      },
    },
  };
}

async function loadPlugin(app) {
  const plugin = new CollapseExplorerPlugin(app);
  await plugin.onload();
  return plugin;
}

function runCollapseCommand(plugin) {
  const command = plugin.commands.find((candidate) => candidate.id === 'collapse-all');
  assert.ok(command, 'collapse-all command is not registered');
  command.callback();
}

function collapsedStates(tree) {
  const states = tree.folders.map((folder) => folder.collapsed);
  return states;
}

describe('collapse-all command', () => {
  beforeEach(() => {
    notices.length = 0;
  });

  it('collapses every expanded folder', async () => {
    const tree = createExplorerTree(['1 Projects', '2 Areas', '3 Resources']);
    const plugin = await loadPlugin(createApp([{ tree }]));

    runCollapseCommand(plugin);

    assert.deepEqual(collapsedStates(tree), [true, true, true]);
    assert.deepEqual(notices, []);
  });

  it('collapses again after a folder was expanded by hand', async () => {
    const tree = createExplorerTree(['1 Projects', '2 Areas']);
    const plugin = await loadPlugin(createApp([{ tree }]));
    runCollapseCommand(plugin);
    tree.expandByHand('2 Areas');

    runCollapseCommand(plugin);

    assert.deepEqual(collapsedStates(tree), [true, true]);
  });

  it('collapses every open file explorer', async () => {
    const left = createExplorerTree(['1 Projects']);
    const right = createExplorerTree(['2 Areas']);
    const plugin = await loadPlugin(createApp([{ tree: left }, { tree: right }]));

    runCollapseCommand(plugin);

    assert.deepEqual([...collapsedStates(left), ...collapsedStates(right)], [true, true]);
  });

  it('shows a notice when the file explorer is not open', async () => {
    const plugin = await loadPlugin(createApp([]));

    runCollapseCommand(plugin);

    assert.deepEqual(notices, ['Collapse Explorer: the file explorer is not open.']);
  });

  it('shows a notice when the explorer no longer exposes the collapse API', async () => {
    const plugin = await loadPlugin(createApp([{ tree: {} }]));

    runCollapseCommand(plugin);

    assert.deepEqual(notices, ['Collapse Explorer: this Obsidian version changed the file explorer API.']);
  });
});
