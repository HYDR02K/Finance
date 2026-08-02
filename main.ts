import { Plugin, WorkspaceLeaf, debounce } from "obsidian";
import { DEFAULT_SETTINGS, FinanceDashboardSettings } from "./types";
import { DataService } from "./dataService";
import { FinanceDashboardView, VIEW_TYPE_FINANCE_DASHBOARD } from "./view";
import { FinanceDashboardSettingTab } from "./settings";

export default class FinanceDashboardPlugin extends Plugin {
  settings!: FinanceDashboardSettings;
  dataService!: DataService;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.dataService = new DataService(this.app, this.settings);

    this.registerView(
      VIEW_TYPE_FINANCE_DASHBOARD,
      (leaf) => new FinanceDashboardView(leaf, this.dataService, this.settings)
    );

    this.addRibbonIcon("wallet", "Open Finance Dashboard", () => this.activateView());
    this.addCommand({
      id: "open-finance-dashboard",
      name: "Open Finance Dashboard",
      callback: () => this.activateView(),
    });

    this.addSettingTab(new FinanceDashboardSettingTab(this.app, this));

    const refresh = debounce(() => this.refreshOpenViews(), 500, true);
    this.registerEvent(this.app.metadataCache.on("changed", refresh));
    this.registerEvent(this.app.vault.on("delete", refresh));
    this.registerEvent(this.app.vault.on("rename", refresh));
    this.registerEvent(this.app.vault.on("create", refresh));
  }

  onunload(): void {
    // Views clean up their own charts in onClose().
  }

  private refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_FINANCE_DASHBOARD)) {
      const view = leaf.view;
      if (view instanceof FinanceDashboardView) void view.refresh();
    }
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_FINANCE_DASHBOARD);

    let leaf: WorkspaceLeaf;
    if (existing.length > 0) {
      leaf = existing[0];
    } else {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_FINANCE_DASHBOARD, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.dataService?.updateSettings(this.settings);
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_FINANCE_DASHBOARD)) {
      const view = leaf.view;
      if (view instanceof FinanceDashboardView) {
        view.updateSettings(this.settings);
        void view.refresh();
      }
    }
  }
}
