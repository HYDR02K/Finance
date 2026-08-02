import { ItemView, WorkspaceLeaf, moment } from "obsidian";
import type { Moment } from "moment";
import { Chart } from "./charts";
import { DataService } from "./dataService";
import { getCycle, cycleLabel, cycleKey, isInCycle, Cycle } from "./cycle";
import { ExpenseRecord, FinanceDashboardSettings } from "./types";

export const VIEW_TYPE_FINANCE_DASHBOARD = "finance-dashboard-view";

const PALETTE = [
  "#FF5722", "#2196F3", "#4CAF50", "#9C27B0", "#FFC107", "#E91E63",
  "#00BCD4", "#FF9800", "#3F51B5", "#CDDC39", "#795548", "#607D8B",
];

export class FinanceDashboardView extends ItemView {
  private dataService: DataService;
  private settings: FinanceDashboardSettings;
  private charts: Chart[] = [];

  constructor(leaf: WorkspaceLeaf, dataService: DataService, settings: FinanceDashboardSettings) {
    super(leaf);
    this.dataService = dataService;
    this.settings = settings;
  }

  getViewType(): string {
    return VIEW_TYPE_FINANCE_DASHBOARD;
  }

  getDisplayText(): string {
    return "Finance Dashboard";
  }

  getIcon(): string {
    return "wallet";
  }

  updateSettings(settings: FinanceDashboardSettings): void {
    this.settings = settings;
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async onClose(): Promise<void> {
    this.destroyCharts();
  }

  async refresh(): Promise<void> {
    await this.render();
  }

  private destroyCharts(): void {
    for (const c of this.charts) c.destroy();
    this.charts = [];
  }

  private fmt(v: number): string {
    const num = Number(v || 0).toLocaleString(this.settings.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${this.settings.currencySymbol} ${num}`;
  }

  private async render(): Promise<void> {
    this.destroyCharts();
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("finance-dashboard-view");

    const header = container.createDiv({ cls: "fd-header" });
    header.createEl("h2", { text: "\uD83D\uDCB0 Finance Dashboard" });
    const refreshBtn = header.createEl("button", { text: "\u27F3 Refresh", cls: "fd-refresh-btn" });
    refreshBtn.onclick = () => this.refresh();

    const expenses = this.dataService.getExpenses();

    if (expenses.length === 0) {
      container.createEl("p", {
        cls: "fd-warning",
        text: `No expense notes found. Make sure your notes are tagged "#${this.settings.expenseTag}" and have "date" and "amount" frontmatter fields.`,
      });
    }

    const today = moment();
    const cycle = getCycle(today, this.settings.cycleStartDay);

    this.renderCycleStatus(container, cycle, today);
    this.renderThisCycleTable(container, expenses, cycle);
    this.renderCycleSummary(container, expenses, cycle);
    this.renderCategoryBreakdown(container, expenses, cycle);
    this.renderMonthlySummary(container, expenses);
    this.renderTopExpenses(container, expenses, cycle);
    this.renderBudgetTracking(container, expenses, cycle);
    this.renderSpendingByType(container, expenses, cycle);
    this.renderSpendingTrends(container, expenses, today);
    this.renderAllExpenses(container, expenses);
  }

  private section(container: HTMLElement, title: string): HTMLElement {
    const section = container.createDiv({ cls: "fd-section" });
    if (title) section.createEl("h3", { text: title });
    return section;
  }

  private table(container: HTMLElement, headers: string[], rows: (string | number)[][]): void {
    const table = container.createEl("table", { cls: "fd-table" });
    const thead = table.createEl("thead");
    const hr = thead.createEl("tr");
    headers.forEach((h) => hr.createEl("th", { text: h }));

    const tbody = table.createEl("tbody");
    if (rows.length === 0) {
      const tr = tbody.createEl("tr");
      const td = tr.createEl("td", { text: "No data" });
      td.colSpan = headers.length;
      td.addClass("fd-empty");
      return;
    }
    for (const row of rows) {
      const tr = tbody.createEl("tr");
      row.forEach((cell) => tr.createEl("td", { text: String(cell) }));
    }
  }

  private inCycle(records: ExpenseRecord[], cycle: Cycle): ExpenseRecord[] {
    return records.filter((r) => isInCycle(r.date, cycle));
  }

  private renderCycleStatus(container: HTMLElement, cycle: Cycle, today: Moment): void {
    const section = this.section(container, "");
    let nextAllowance: Moment;
    if (today.date() < this.settings.cycleStartDay) {
      nextAllowance = today.clone().date(this.settings.cycleStartDay);
    } else {
      nextAllowance = today.clone().add(1, "month").date(this.settings.cycleStartDay);
    }
    const daysLeft = cycle.end.clone().add(1, "day").diff(today.clone().startOf("day"), "days");

    const p1 = section.createEl("p");
    p1.createEl("strong", { text: "Next allowance: " });
    p1.appendText(nextAllowance.format("D MMMM YYYY"));

    const p2 = section.createEl("p");
    p2.createEl("strong", { text: "Days left: " });
    p2.appendText(`${daysLeft} day${daysLeft !== 1 ? "s" : ""}`);
  }

  private renderThisCycleTable(container: HTMLElement, expenses: ExpenseRecord[], cycle: Cycle): void {
    const section = this.section(container, `This Cycle (${cycleLabel(cycle)})`);
    const rows = this.inCycle(expenses, cycle)
      .sort((a, b) => b.date.valueOf() - a.date.valueOf())
      .map((r) => [r.date.format("YYYY-MM-DD"), r.description, r.category, this.fmt(r.amount)]);
    this.table(section, ["Date", "Description", "Category", "Amount"], rows);
  }

  private renderCycleSummary(container: HTMLElement, expenses: ExpenseRecord[], cycle: Cycle): void {
    const section = this.section(container, "Cycle Summary");
    const inCycle = this.inCycle(expenses, cycle);
    const total = inCycle.reduce((s, r) => s + r.amount, 0);
    section.createEl("p", { text: `Total spent: ${this.fmt(total)}` });
    section.createEl("p", { text: `Transactions: ${inCycle.length}` });
  }

  private renderCategoryBreakdown(container: HTMLElement, expenses: ExpenseRecord[], cycle: Cycle): void {
    const section = this.section(container, "Spending by Category");
    const budget = this.dataService.getBudgetConfig();
    const totalIncome = budget?.totalIncome || 1;

    const inCycle = this.inCycle(expenses, cycle);
    const byCat: Record<string, number> = {};
    for (const r of inCycle) byCat[r.type] = (byCat[r.type] || 0) + r.amount;

    const rows = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => [cat, this.fmt(total), `${((total / totalIncome) * 100).toFixed(1)}%`]);

    this.table(section, ["Category", "Total", "% of Income"], rows);
  }

  private renderMonthlySummary(container: HTMLElement, expenses: ExpenseRecord[]): void {
    const section = this.section(container, "Monthly Summary");
    const byCycle: Record<string, { label: string; total: number }> = {};

    for (const r of expenses) {
      const c = getCycle(r.date, this.settings.cycleStartDay);
      const key = cycleKey(c);
      if (!byCycle[key]) byCycle[key] = { label: cycleLabel(c), total: 0 };
      byCycle[key].total += r.amount;
    }

    const rows = Object.entries(byCycle)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, v]) => [v.label, this.fmt(v.total)]);

    this.table(section, ["Cycle", "Total Spent"], rows);
  }

  private renderTopExpenses(container: HTMLElement, expenses: ExpenseRecord[], cycle: Cycle): void {
    const section = this.section(container, "Top 5 Largest Expenses");
    const rows = this.inCycle(expenses, cycle)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((r) => [r.date.format("YYYY-MM-DD"), r.description, r.category, this.fmt(r.amount)]);
    this.table(section, ["Date", "Description", "Category", "Amount"], rows);
  }

  private renderBudgetTracking(container: HTMLElement, expenses: ExpenseRecord[], cycle: Cycle): void {
    const section = this.section(container, `Budget Tracking: ${cycleLabel(cycle)}`);
    const budget = this.dataService.getBudgetConfig();

    if (!budget) {
      section.createEl("p", {
        cls: "fd-warning",
        text: `\u26A0\uFE0F Could not find the budget config note at "${this.settings.budgetConfigPath}". Check the plugin settings.`,
      });
      return;
    }

    const inCycle = this.inCycle(expenses, cycle);
    const spentByCat: Record<string, number> = {};
    for (const r of inCycle) {
      const key = r.category.trim().toLowerCase();
      spentByCat[key] = (spentByCat[key] || 0) + r.amount;
    }

    const catKeys = Array.from(new Set([...Object.keys(budget.allocations), ...Object.keys(spentByCat)]));
    const rows: (string | number)[][] = [];
    const labels: string[] = [];
    const allocatedData: number[] = [];
    const spentData: number[] = [];

    for (const key of catKeys) {
      const percent = budget.allocations[key] || 0;
      const allocated = budget.totalIncome * percent;
      const spent = spentByCat[key] || 0;
      const remaining = allocated - spent;
      const pctUsed = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0;
      const display = key.charAt(0).toUpperCase() + key.slice(1);

      let pctLabel: string;
      if (pctUsed >= 100) pctLabel = `\uD83D\uDD34 ${pctUsed.toFixed(1)}%`;
      else if (pctUsed >= 80) pctLabel = `\uD83D\uDFE1 ${pctUsed.toFixed(1)}%`;
      else pctLabel = `\uD83D\uDFE2 ${pctUsed.toFixed(1)}%`;

      rows.push([
        display,
        this.fmt(allocated),
        this.fmt(spent),
        this.fmt(remaining),
        pctLabel,
        remaining >= 0 ? "\u2705 Within" : "\u274C Over",
      ]);
      labels.push(display);
      allocatedData.push(allocated);
      spentData.push(spent);
    }

    this.table(section, [`Category (${catKeys.length})`, "Budget", "Spent", "Remaining", "% Used", "Status"], rows);

    if (labels.length === 0) return;

    const chartWrap = section.createDiv({ cls: "fd-chart-wrap" });
    const canvas = chartWrap.createEl("canvas");
    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Allocated", data: allocatedData, backgroundColor: "rgba(0,123,255,0.85)" },
          { label: "Spent", data: spentData, backgroundColor: "rgba(255,23,68,0.85)" },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => this.fmt(Number(v)) } } },
        plugins: {
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${this.fmt(Number(ctx.parsed.y))}` } },
        },
      },
    });
    this.charts.push(chart);
  }

  private renderSpendingByType(container: HTMLElement, expenses: ExpenseRecord[], cycle: Cycle): void {
    const section = this.section(container, "Spending by Type");
    const inCycle = this.inCycle(expenses, cycle);
    const byType: Record<string, number> = {};
    for (const r of inCycle) byType[r.type] = (byType[r.type] || 0) + r.amount;

    const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      section.createEl("p", { text: "No expenses recorded this cycle yet." });
      return;
    }

    const labels = entries.map(([t]) => t);
    const totals = entries.map(([, v]) => v);

    const chartWrap = section.createDiv({ cls: "fd-chart-wrap fd-chart-wrap-small" });
    const canvas = chartWrap.createEl("canvas");
    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data: totals, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]) }],
      },
      options: {
        responsive: true,
        cutout: "55%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = totals.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((Number(ctx.parsed) / total) * 100).toFixed(1) : "0.0";
                return `${ctx.label}: ${this.fmt(Number(ctx.parsed))} (${pct}%)`;
              },
            },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  private renderSpendingTrends(container: HTMLElement, expenses: ExpenseRecord[], today: Moment): void {
    const section = this.section(container, "Spending Trends (Last 3 Cycles)");
    const cycles: Cycle[] = [];
    for (let i = 2; i >= 0; i--) {
      cycles.push(getCycle(today.clone().subtract(i, "months"), this.settings.cycleStartDay));
    }
    const cycleLabels = cycles.map((c) => `${c.start.format("MMM")} - ${c.end.format("MMM YY")}`);
    const types = Array.from(new Set(expenses.map((r) => r.type))).sort();

    if (types.length === 0) {
      section.createEl("p", { text: "No expenses recorded yet." });
      return;
    }

    types.forEach((type, i) => {
      const data = cycles.map((c) =>
        expenses
          .filter((r) => r.type === type && isInCycle(r.date, c))
          .reduce((s, r) => s + r.amount, 0)
      );
      const color = PALETTE[i % PALETTE.length];

      const chartWrap = section.createDiv({ cls: "fd-chart-wrap fd-chart-wrap-small" });
      const canvas = chartWrap.createEl("canvas");
      const chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: cycleLabels,
          datasets: [
            {
              label: `${type} Spending`,
              data,
              borderColor: color,
              backgroundColor: `${color}26`,
              borderWidth: 3,
              pointRadius: 5,
              fill: true,
              tension: 0,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { title: { display: true, text: `${type} Trend` }, legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
      this.charts.push(chart);
    });
  }

  private renderAllExpenses(container: HTMLElement, expenses: ExpenseRecord[]): void {
    const section = this.section(container, "All Expenses");
    const rows = [...expenses]
      .sort((a, b) => b.date.valueOf() - a.date.valueOf())
      .map((r) => [
        r.date.format("YYYY-MM-DD"),
        r.description,
        r.category,
        r.paymentMethod,
        `${this.fmt(r.amount)} ${r.currency}`,
      ]);
    this.table(section, ["Date", "Description", "Category", "Payment Method", "Amount"], rows);
  }
}
