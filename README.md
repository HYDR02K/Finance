# Finance Dashboard (Obsidian Plugin)

A self-contained personal finance dashboard for Obsidian. It reads your
expense notes and a budget config note directly from the vault (no
Dataview/DataviewJS required) and renders an interactive dashboard in its
own pane: cycle status, category/type breakdowns, a budget-vs-actual chart,
a spending-by-type doughnut chart, and 3-cycle spending trend lines.

This plugin re-implements and extends the logic from a DataviewJS-based
dashboard as a native, packaged Obsidian plugin, so it works without the
Dataview plugin, bundles its own copy of Chart.js, and refreshes
automatically as you edit notes.

## Features

- Custom pay-cycle support (e.g. 26th \u2192 25th), configurable start day
- "This cycle" expense table, cycle summary, top 5 largest expenses
- Spending by category / by type, with % of income
- Monthly (cycle-by-cycle) summary table
- Budget tracking table + bar chart (allocated vs. spent), colour-coded
  status (\ud83d\udfe2 under 80%, \ud83d\udfe1 80\u2013100%, \ud83d\udd34 over budget)
- Doughnut chart of spending by type for the current cycle
- Line charts of spending trend per type over the last 3 cycles
- Auto-refreshes when notes are created, edited, renamed, or deleted
- Configurable expense tag, budget note path, folder-based "type", cycle
  start day, currency symbol, and locale \u2014 all from Settings

## Expected note format

**Expense notes** need a tag (default `#expense`) and frontmatter like:

```yaml
---
tags: [expense]
date: 2026-07-14
amount: 45.90
currency: MYR
category: Food
description: Groceries
payment_method: Debit Card
---
```

If the note lives under a folder named `Type` (configurable), e.g.
`Expenses/Type/Food/2026-07-14 Groceries.md`, the segment after `Type` is
used as the expense's "type" for the type/category breakdown charts;
otherwise the `category` field is used.

**Budget config note** (path configurable, default `Expenses/Budget
Config`) needs frontmatter like:

```yaml
---
totalIncome: 5000
food: 0.15
transport: 0.10
entertainment: 0.05
savings: 0.20
---
```

Each numeric key other than `totalIncome` is treated as the fraction of
income allocated to that category (e.g. `0.15` = 15%).

## Installing in your vault

### Option A \u2014 manual install (recommended to start)

1. Build the plugin (see below) or download `main.js`, `manifest.json`,
   and `styles.css` from a GitHub release.
2. Create a folder `<your-vault>/.obsidian/plugins/finance-dashboard/`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
4. In Obsidian, go to **Settings \u2192 Community plugins**, disable
   **Restricted mode** if needed, and enable **Finance Dashboard**.
5. Open the dashboard via the wallet icon in the left ribbon, or run the
   command **"Open Finance Dashboard"** from the command palette.
6. Configure the expense tag, budget note path, and cycle start day under
   **Settings \u2192 Finance Dashboard**.

### Option B \u2014 BRAT (Beta Reviewers Auto-update Tester)

If you publish this repo on GitHub, vault owners can install it via the
[BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) by pointing it
at your repository, without needing to submit to the official community
plugin list.

## Building from source

```bash
npm install
npm run build
```

This produces `main.js` in the project root (Chart.js is bundled in, so
no external CDN is required at runtime). Use `npm run dev` for a watch
build while developing.

## Publishing a GitHub release

Obsidian (and BRAT) expect a GitHub release whose assets include, at the
top level (not inside a zip):

- `main.js`
- `manifest.json`
- `styles.css`

Tag the release with the exact version in `manifest.json` (e.g. `1.0.0`),
and keep `versions.json` updated if you bump `minAppVersion` in a future
release.

## License

MIT \u2014 do whatever you like with it.
