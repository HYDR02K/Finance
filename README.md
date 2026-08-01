# Pro Dashboard Style

A pure-CSS layout upgrade for your expense dashboard note. It does not read,
run, or alter any of your `dataview` / `dataviewjs` code — it only restyles
the DOM elements Dataview already renders (headings, tables, chart canvases,
paragraphs) into a proper multi-column dashboard grid instead of one long
vertical list.

## What actually changed

- **Your dashboard note:** exactly one line, in the frontmatter:
  ```
  cssclasses: pro-dashboard
  ```
  That's it — every `dataview`/`dataviewjs` code block is byte-for-byte
  identical to what you had. This line just tells Obsidian to attach a CSS
  class to the note so the styling below only applies there, not to every
  note in your vault.
- **New plugin (`pro-dashboard-style`):** ships one stylesheet. `main.js` is
  intentionally empty — its only job is to make Obsidian load `styles.css`.

## How the layout works

- Headings you wrote directly in the note (`## Budget Tracking & Chart`,
  `### Spending by Category`, etc.) become full-width section dividers.
- Every rendered block below a heading (a table, a chart, a stat line)
  becomes its own card and flows into a responsive grid — narrow stat
  blocks sit side by side, while tables and charts automatically take the
  full row since they need the room.
- Each card gets a thin top accent that tells you what kind of content it
  holds at a glance: teal for tables, amber for quick stats, coral for
  charts.
- Tables get zebra striping, hover highlighting, and monospaced numbers.
  Chart canvases are constrained to look tidy inside their cards.
- The invisible "setup" block (the one that just defines shared helper
  functions) is hidden entirely instead of leaving a blank card.

None of this changes what any block calculates or displays — only where and
how it sits on the page.

## Install (manual — not in the Community Plugins store)

1. Copy the `pro-dashboard-style` folder into `YourVault/.obsidian/plugins/`, so you have:
   ```
   YourVault/.obsidian/plugins/pro-dashboard-style/manifest.json
   YourVault/.obsidian/plugins/pro-dashboard-style/main.js
   YourVault/.obsidian/plugins/pro-dashboard-style/styles.css
   ```
2. Settings → Community plugins → turn off Restricted mode if needed → Reload plugins → enable "Pro Dashboard Style."
3. Replace `Dashboard_pro.md` with the updated version (same content, just the one added frontmatter line), or manually add `cssclasses: pro-dashboard` to your existing note's frontmatter yourself.

## Installing via BRAT (e.g. on iPad)

Same process as your other dashboard plugin:
1. Install "Obsidian42 - BRAT" from Community Plugins.
2. Push these three files to a public GitHub repo (`manifest.json` at the root).
3. Create a Release tagged to match `manifest.json`'s version (`1.0.0`), with the three files attached.
4. Settings → BRAT → "Add Beta Plugin" → paste your repo URL.

## Reusing this on other notes

Add `cssclasses: pro-dashboard` to any other note's frontmatter and it'll
get the same grid layout — useful if you build more Dataview dashboards
later. If you want a *different* look for a different dashboard, duplicate
`styles.css`, rename the `.pro-dashboard` class throughout to something
else (e.g. `.study-dashboard`), and give that note the new class instead.

## If something looks off

- **A section still looks meaningfully like the old vertical list on your
  version of Obsidian:** the CSS targets Obsidian's standard
  `.markdown-preview-sizer` reading-view container. If your theme heavily
  restructures that (rare), the grid may not apply — let me know what
  theme you're using and I can adjust the selector.
- **Fonts look like the system default:** you're likely offline; the
  Fraunces/IBM Plex fonts load from Google Fonts and fall back cleanly to
  your normal fonts if unreachable.
