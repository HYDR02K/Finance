const { Plugin } = require("obsidian");

/**
 * Pro Dashboard Style
 *
 * This plugin intentionally does nothing but load styles.css.
 * All the visual upgrade lives entirely in CSS, targeting the DOM
 * that Dataview already renders — no dataview/dataviewjs code is
 * read, touched, or executed by this plugin.
 *
 * To apply the styling to a note, add this to that note's frontmatter:
 *
 *   cssclasses: pro-dashboard
 *
 * That's the only thing that needs to change in your note.
 */
module.exports = class ProDashboardStylePlugin extends Plugin {
  async onload() {
    // No-op — styles.css is loaded automatically by Obsidian.
  }

  onunload() {}
};
