'use strict';

const { Notice, Plugin } = require('obsidian');

const FILE_EXPLORER_VIEW_TYPE = 'file-explorer';

/**
 * Registers the "Collapse all folders" command for the core file explorer.
 *
 * Relies on the explorer's internal `tree.setCollapseAll`, the same call
 * behind its "Collapse all" nav button. It is not public API, so the command
 * reports a notice instead of failing silently if a future release removes it.
 */
class CollapseExplorerPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'collapse-all',
      name: 'Collapse all folders',
      callback: () => this.collapseAllFolders(),
    });
  }

  collapseAllFolders() {
    const leaves = this.app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE);
    if (leaves.length === 0) {
      new Notice('Collapse Explorer: the file explorer is not open.');
      return;
    }

    for (const leaf of leaves) {
      const tree = leaf.view && leaf.view.tree;
      const hasCollapseApi = Boolean(tree) && typeof tree.setCollapseAll === 'function';
      if (!hasCollapseApi) {
        new Notice('Collapse Explorer: this Obsidian version changed the file explorer API.');
        return;
      }

      // setCollapseAll is a no-op when its cached flag is already true, even if
      // folders were expanded by hand afterwards; clearing it forces the pass.
      tree.isAllCollapsed = false;
      tree.setCollapseAll(true);
    }
  }
}

module.exports = CollapseExplorerPlugin;
