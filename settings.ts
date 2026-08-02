import { App, PluginSettingTab, Setting } from "obsidian";
import type FinanceDashboardPlugin from "./main";

export class FinanceDashboardSettingTab extends PluginSettingTab {
  plugin: FinanceDashboardPlugin;

  constructor(app: App, plugin: FinanceDashboardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Finance Dashboard Settings" });

    new Setting(containerEl)
      .setName("Expense tag")
      .setDesc('Notes tagged with this tag (frontmatter "tags" or inline "#tag") are treated as expenses. Enter without the #.')
      .addText((text) =>
        text.setValue(this.plugin.settings.expenseTag).onChange(async (v) => {
          this.plugin.settings.expenseTag = v.trim() || "expense";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Budget config note path")
      .setDesc('Path (without .md) to the note holding "totalIncome" and category allocation frontmatter, e.g. "Expenses/Budget Config".')
      .addText((text) =>
        text.setValue(this.plugin.settings.budgetConfigPath).onChange(async (v) => {
          this.plugin.settings.budgetConfigPath = v.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Type folder name")
      .setDesc('Folder name used to derive an expense\'s "type" from its path, e.g. Expenses/Type/Food/note.md \u2192 "Food".')
      .addText((text) =>
        text.setValue(this.plugin.settings.typeFolderName).onChange(async (v) => {
          this.plugin.settings.typeFolderName = v.trim() || "Type";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Cycle start day")
      .setDesc("Day of month your budget cycle starts on (1\u201328). E.g. 26 for a 26th\u201325th cycle.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.cycleStartDay)).onChange(async (v) => {
          const n = parseInt(v, 10);
          this.plugin.settings.cycleStartDay = Number.isNaN(n) ? 1 : Math.min(28, Math.max(1, n));
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Currency symbol")
      .setDesc('Used as a fallback and as the display prefix for formatted amounts, e.g. "RM", "$".')
      .addText((text) =>
        text.setValue(this.plugin.settings.currencySymbol).onChange(async (v) => {
          this.plugin.settings.currencySymbol = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Locale")
      .setDesc('Used for number formatting, e.g. "en-MY", "en-US".')
      .addText((text) =>
        text.setValue(this.plugin.settings.locale).onChange(async (v) => {
          this.plugin.settings.locale = v.trim() || "en-US";
          await this.plugin.saveSettings();
        })
      );
  }
}
