import { App, TFile, moment } from "obsidian";
import { ExpenseRecord, BudgetConfig, FinanceDashboardSettings } from "./types";

export class DataService {
  constructor(private app: App, private settings: FinanceDashboardSettings) {}

  updateSettings(settings: FinanceDashboardSettings): void {
    this.settings = settings;
  }

  private normalizeTag(tag: string): string {
    return tag.replace(/^#/, "").trim().toLowerCase();
  }

  private hasExpenseTag(file: TFile): boolean {
    const wanted = this.normalizeTag(this.settings.expenseTag);
    if (!wanted) return false;
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache) return false;

    const fmTags = cache.frontmatter?.tags;
    if (fmTags) {
      const arr = Array.isArray(fmTags) ? fmTags : [fmTags];
      if (arr.some((t) => this.normalizeTag(String(t)) === wanted)) return true;
    }
    if (cache.tags?.some((t) => this.normalizeTag(t.tag) === wanted)) return true;
    return false;
  }

  /** Derives a "type" from the folder structure, e.g. .../Type/Food/note.md -> "Food". */
  private extractType(file: TFile, category: string): string {
    const parts = file.parent?.path.split("/") ?? [];
    const idx = parts.indexOf(this.settings.typeFolderName);
    if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
    return category || "Other";
  }

  getExpenses(): ExpenseRecord[] {
    const files = this.app.vault.getMarkdownFiles();
    const records: ExpenseRecord[] = [];

    for (const file of files) {
      if (!this.hasExpenseTag(file)) continue;

      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (!fm || fm.date == null || fm.amount == null) continue;

      const date = moment(String(fm.date), ["YYYY-MM-DD", moment.ISO_8601], true);
      if (!date.isValid()) continue;

      const amount = Number(fm.amount);
      if (Number.isNaN(amount)) continue;

      const category = String(fm.category ?? "Miscellaneous");

      records.push({
        file: file.path,
        date,
        amount,
        currency: fm.currency ? String(fm.currency) : this.settings.currencySymbol,
        category,
        type: this.extractType(file, category),
        description: String(fm.description ?? file.basename),
        paymentMethod: String(fm.payment_method ?? fm.paymentMethod ?? ""),
      });
    }

    return records;
  }

  getBudgetConfig(): BudgetConfig | null {
    const path = this.settings.budgetConfigPath.endsWith(".md")
      ? this.settings.budgetConfigPath
      : `${this.settings.budgetConfigPath}.md`;

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return null;

    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!fm) return null;

    const totalIncome = Number(fm.totalIncome ?? fm.total_income ?? 0);
    const allocations: Record<string, number> = {};

    for (const [key, value] of Object.entries(fm)) {
      const cleanKey = key.trim().toLowerCase();
      if (["totalincome", "total_income", "income", "position", "tags"].includes(cleanKey)) continue;
      if (typeof value === "number") allocations[cleanKey] = value;
    }

    return { totalIncome, allocations };
  }
}
