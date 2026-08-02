import type { Moment } from "moment";

export interface ExpenseRecord {
  file: string;
  date: Moment;
  amount: number;
  currency: string;
  category: string;
  type: string;
  description: string;
  paymentMethod: string;
}

export interface BudgetConfig {
  totalIncome: number;
  /** category key (lowercased) -> fraction of income allocated, e.g. 0.15 for 15% */
  allocations: Record<string, number>;
}

export interface FinanceDashboardSettings {
  /** Tag (without #) used to identify expense notes. */
  expenseTag: string;
  /** Path to the budget config note, without the .md extension. */
  budgetConfigPath: string;
  /** Folder name in an expense note's path that precedes its "type" segment. */
  typeFolderName: string;
  /** Day of month the budget cycle starts on (1-28). */
  cycleStartDay: number;
  /** Currency symbol used in formatted amounts. */
  currencySymbol: string;
  /** Locale used for number formatting. */
  locale: string;
}

export const DEFAULT_SETTINGS: FinanceDashboardSettings = {
  expenseTag: "expense",
  budgetConfigPath: "Expenses/Budget Config",
  typeFolderName: "Type",
  cycleStartDay: 26,
  currencySymbol: "RM",
  locale: "en-MY",
};
