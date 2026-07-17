# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server at http://localhost:3000
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint (eslint-config-next)
```

There is no test suite. `quick-start.sh` (Mac/Linux) and `quick-start.bat` (Windows) just wrap `npm install` + `npm run dev`.

## Architecture

Single-page Next.js 14 App Router app (TypeScript + Tailwind). It is a read-only public dashboard for South Louisville Community Ministries showing donor "needs" pulled live from a Google Sheet. There is no backend, database, or API route — data is fetched client-side directly from Google.

Effectively the entire app lives in one file: **`src/components/SLCMDashboard.tsx`**. `src/app/page.tsx` just renders it; `layout.tsx` sets metadata/fonts; `src/components/ui/*` are shadcn-style primitives (button, card, progress) and `src/lib/utils.ts` is the `cn()` class merger. When changing behavior, you are almost always editing `SLCMDashboard.tsx`.

### Data flow (all in `SLCMDashboard.tsx`)
1. Config constants at the top of the file (`USE_SAMPLE_DATA`, `PUBLIC_CSV_URL`, `SHEET_ID`, `SHEET_RANGE`) select the data source. Priority in `fetchSheetRows()`: sample data → published CSV URL → Sheets API (`NEXT_PUBLIC_GOOGLE_API_KEY`). Any fetch failure falls back to `SAMPLE_ROWS`.
2. `parseCSV()` → 2D string array → `rowsToGoals()` maps rows to the `Goal` type, looking up columns **by header name** (case-insensitive), so column order in the sheet doesn't matter.
3. Derived state via `useMemo`: `active`, `completed`, `topByCategory`, `stats`.

### Domain rules to preserve
- **Sheet columns** (matched by name): `Category`, `Title`, `Description`, `Target`, `Current`, `Link`, `Status`, plus optional `Deadline` (MM/DD/YYYY) and `Priority`. The first 7 are validated by `validateHeaders()`.
- **Categories** are `Money`, `Items`, `Time` — matched throughout via `.toLowerCase()` substring checks (`includes("money")` / `startsWith(...)`). This drives the icon, button label, and color (Money=emerald, Items=purple, Time=blue).
- **Completed** = `Current >= Target` (with Target > 0) OR `Status === "Completed"`. Completed goals trigger a one-time confetti burst.
- **Urgency** (`urgencyLevel`) is computed in `rowsToGoals()`: `Priority = High` → urgent; else derived from `daysRemaining` (≤7 urgent, ≤30 important).
- **Top-needs sort**: the front page shows one card per category — the highest-priority active need, scored as `urgencyWeight - percentComplete` (urgent 1000 / important 500 / standard 0). "View All" opens a modal with every active need in that category, same sort.
- `Target`/`Current` are sanitized with `replace(/[^0-9.]/g, "")`, so `$1,000` in the sheet is fine, but keep values numeric-ish.

## Conventions
- `@/*` path alias → `./src/*` (see `tsconfig.json`).
- `SLCMDashboard.tsx` is a client component (`"use client"`) — it uses hooks, `framer-motion`, and `canvas-confetti`.
- Styling is Tailwind utility classes inline; category colors are hardcoded conditionals, not a theme map.

## Deployment
Designed for Vercel (zero-config Next.js). To go live against a real sheet: set `USE_SAMPLE_DATA = false` and either fill in `PUBLIC_CSV_URL` (published-to-web CSV) or set `SHEET_ID` + the `NEXT_PUBLIC_GOOGLE_API_KEY` env var. See `README.md` / `GOOGLE_SHEET_TEMPLATE.md` for the sheet setup; `STAFF_GUIDE.md` documents the non-technical staff editing workflow.
