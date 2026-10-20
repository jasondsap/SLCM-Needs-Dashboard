"use client";

import React, { useState } from "react";
import {
  FISCAL,
  INCOME_MIX,
  LINKS,
  SHOW_INDIVIDUAL_DONOR_NAMES,
  SPOTLIGHTS,
  useBudgetData,
  usd,
  type BudgetData,
  type IncomeColumn,
} from "./SLCMBudgetDashboard";

/**
 * SLCM Budget Tracker — DESIGN PREVIEW
 * ------------------------------------
 * Renders the restyle proposed in docs/"Suggest UI Color Updates.pdf" on top
 * of the same live data as /budget, so the two can be compared side by side
 * before anything goes live. Data wiring lives in useBudgetData(); this file
 * is presentation only. If the design is approved it replaces the markup and
 * CSS in SLCMBudgetDashboard.tsx; if not, delete this file and the route.
 *
 * Changes from the proposal, on purpose:
 *  - No coral "urgent" state. Early in a quarter most funds sit at $0 because
 *    nothing is recorded yet, and coral would read as alarm across the page.
 *    Gold marks a funding gap (< 25% funded); sage marks a goal reached.
 *  - Title is "Community Funding" (the Needs dashboard already owns
 *    "Community Impact"), with Budget Tracker as the subtitle.
 *  - The income-mix bars keep the "planning figures" caveat: those
 *    percentages are Clare's Canva numbers, not reconciled to the sheet.
 */

const GROUP_BLURB: Record<string, string> = {
  People: "The team that delivers every program",
  "Direct Assistance": "Money that goes straight to neighbors",
  Operations: "Keeping the lights on and the doors open",
  Development: "Events that fund the rest of the year",
};

const DONOR_CARD: Record<string, { title: string; blurb: string; icon: keyof typeof ICONS }> = {
  "Corporate Giving": { title: "Corporate Giving", blurb: "Local employers investing in South Louisville", icon: "building" },
  Churches: { title: "Church Partners", blurb: "Community congregations", icon: "church" },
  Donations: { title: "Individual Donors", blurb: "Including monthly gifts", icon: "heart" },
  Philanthropy: { title: "Philanthropy", blurb: "Foundations and grants", icon: "landmark" },
  "Earned Income": { title: "Earned Income", blurb: "Rosewater sales and other community-generated revenue", icon: "bag" },
  "Our Government Partners": { title: "Government Partners", blurb: "Public funding for public good", icon: "flag" },
};

// Uncapped percentage for labels; bars are clamped separately.
const pctRaw = (raised: number, goal: number) => (goal <= 0 ? 0 : Math.round((raised / goal) * 100));

// Small inline icons (16px, stroke-based) so the page needs no icon library.
const ICONS = {
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.5a5 5 0 0 1 6 4.5" />
    </svg>
  ),
  hand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.6 12 20 12 20z" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10v4a1 1 0 0 0 1 1h3l8 4V5L7 9H4a1 1 0 0 0-1 1z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </svg>
  ),
  church: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v5M9.5 4.5h5" />
      <path d="M6 21v-8l6-5 6 5v8" />
      <path d="M10 21v-4h4v4" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.6 12 20 12 20z" />
    </svg>
  ),
  landmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-5 9 5" />
      <path d="M5 9v9M9 9v9M15 9v9M19 9v9M3 21h18" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  flag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  ),
};

const GROUP_ICON: Record<string, keyof typeof ICONS> = {
  People: "people",
  "Direct Assistance": "hand",
  Operations: "gear",
  Development: "megaphone",
  "Capital Campaign": "home",
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <span className="ico" aria-hidden>
      {ICONS[name]}
    </span>
  );
}

// Single-color progress bar. `tone` picks the fill colour; width clamps at 100.
function Bar({ value, tone = "green", size = "md" }: { value: number; tone?: "green" | "gold" | "sage"; size?: "md" | "lg" }) {
  return (
    <div className={`bar bar-${size} bar-${tone}`} role="img" aria-label={`${value}% funded`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

type Row = BudgetData["rows"][number];

function FundCard({ r, view }: { r: Row; view: "quarter" | "annual" }) {
  const [open, setOpen] = useState(false);
  const raw = pctRaw(r.raised, r.goal);
  const state = raw >= 100 ? "done" : raw < 25 ? "gap" : "on";
  const remaining = Math.max(0, r.goal - r.raised);
  return (
    <article className={`fund fund-${state}`}>
      <div className="fund-top">
        <h3>{r.name}</h3>
        <span className={`badge badge-${state}`}>{state === "done" ? `${raw}% of goal` : `${raw}% funded`}</span>
      </div>
      <p className="fund-amt">
        <strong>{usd(r.raised)}</strong>
        {state !== "done" && <span>of {usd(r.goal)} goal</span>}
      </p>
      {state === "done" ? (
        <p className="fund-line fund-line-done">Goal reached — thank you, South Louisville.</p>
      ) : (
        <>
          <Bar value={raw} tone={state === "gap" ? "gold" : "green"} />
          <p className={`fund-line ${state === "gap" ? "fund-line-gap" : ""}`}>
            {usd(remaining)} {state === "gap" ? "still needed" : "remaining to reach goal"}
            {view === "quarter" ? " this quarter" : " this year"}
          </p>
        </>
      )}
      {(r.link || r.description) && (
        <div className="fund-actions">
          {r.link && (
            <a className="pill" href={r.link} target="_blank" rel="noopener noreferrer">
              Learn more
            </a>
          )}
          {r.description && (
            <button type="button" className={"pill pill-ghost" + (open ? " on" : "")} aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? "Hide details" : "What this funds"}
            </button>
          )}
        </div>
      )}
      {r.description && open && <p className="fund-note">{r.description}</p>}
      {r.programs && r.programs.length > 0 && (
        <ul className="programs" aria-label={`${r.name} by program`}>
          {r.programs.map((p) => (
            <li key={p.name}>
              <div className="program-row">
                <span className="program-name">{p.name}</span>
                <span className="program-figs">
                  {usd(p.raised)} <em>of {usd(p.goal)}</em>
                </span>
              </div>
              <Bar value={pctRaw(p.raised, p.goal)} size="md" />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function DonorCard({ col }: { col: IncomeColumn }) {
  const [open, setOpen] = useState(false);
  const meta = DONOR_CARD[col.label] ?? { title: col.label, blurb: "", icon: "heart" as const };
  const withheld = col.label === "Donations" && !SHOW_INDIVIDUAL_DONOR_NAMES;
  const count = col.donors.length;
  return (
    <article className="donor">
      <Icon name={meta.icon} />
      <h3>{meta.title}</h3>
      <p className="donor-fig">
        {col.total !== null ? usd(col.total) : `${count} ${count === 1 ? "supporter" : "supporters"}`}
      </p>
      <p className="donor-blurb">{meta.blurb}</p>
      {!withheld && count > 0 && (
        <button type="button" className="pill pill-ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Hide supporters" : `View ${count === 1 ? "supporter" : "supporters"}`}
        </button>
      )}
      {withheld && <p className="donor-blurb">{count} individual donors</p>}
      {open && !withheld && (
        <ul className="donor-list">
          {col.donors.map((d) => (
            <li key={d.name}>
              {d.name}
              {d.monthly && <span className="monthly">monthly</span>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

const MIX_COLORS = ["#185B43", "#24835F", "#7FB69A", "#D6A63A", "#E8C878"];

function MixBar({ label, slices }: { label: string; slices: typeof INCOME_MIX.current }) {
  return (
    <div className="mix-row">
      <span className="mix-label">{label}</span>
      <div className="mix-bar" role="img" aria-label={`${label} income mix`}>
        {slices.map((s, i) => (
          <span key={s.source} style={{ width: `${s.pct}%`, background: MIX_COLORS[i] }} title={`${s.source} ${s.pct}%`} />
        ))}
      </div>
    </div>
  );
}

export default function SLCMBudgetPreview() {
  const [view, setView] = useState<"quarter" | "annual">("quarter");
  const { feed, totals, groups, capital, incomeColumns, government } = useBudgetData(view);
  const [loadedAt] = useState(() => new Date());

  const remaining = Math.max(0, totals.goal - totals.raised);
  const period = view === "quarter" ? "this quarter" : "this year";

  return (
    <div className="pv">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="preview-banner">
        <strong>Design preview.</strong> This is a proposed look for the Budget Tracker, reading the same live sheet.{" "}
        <a href="/budget">See the current page</a>
      </div>

      {/* Header */}
      <header className="head">
        <div className="head-row">
          <div>
            <p className="eyebrow">South Louisville Community Ministries · {FISCAL.fiscalYear}</p>
            <h1>Community Funding</h1>
            <p className="sub">
              Budget Tracker · {view === "quarter" ? FISCAL.quarterLabel : "Full year"}
            </p>
          </div>
          <div className="toggle" role="tablist" aria-label="Time frame">
            <button role="tab" aria-selected={view === "quarter"} className={view === "quarter" ? "on" : ""} onClick={() => setView("quarter")}>
              Quarterly
            </button>
            <button role="tab" aria-selected={view === "annual"} className={view === "annual" ? "on" : ""} onClick={() => setView("annual")}>
              Annual
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <span className="hero-label">Total raised {period}</span>
        <span className="hero-raised">{usd(totals.raised)}</span>
        <span className="hero-of">of {usd(totals.goal)} fundraising goal</span>
        <Bar value={totals.funded} tone="gold" size="lg" />
        <div className="hero-foot">
          <span>{pctRaw(totals.raised, totals.goal)}% funded</span>
          <span>{usd(remaining)} remaining</span>
        </div>
      </section>

      {/* Group summary tiles */}
      <div className="tiles">
        {groups.map(({ group, items }) => {
          const raised = items.reduce((s, r) => s + r.raised, 0);
          const goal = items.reduce((s, r) => s + r.goal, 0);
          return (
            <a className="tile" key={group} href={`#g-${group.replace(/\s+/g, "-").toLowerCase()}`}>
              <span className="tile-head">
                <Icon name={GROUP_ICON[group] ?? "hand"} />
                {group}
              </span>
              <span className="tile-fig">{usd(raised)}</span>
              <span className="tile-sub">{pctRaw(raised, goal)}% of {usd(goal)}</span>
            </a>
          );
        })}
      </div>

      <p className="data-note">
        <span className="data-tag">About these numbers</span>
        Amounts are gifts recorded in SLCM's Budget Tracking Spreadsheet, not pledges or spending. Goals are the
        {" "}{FISCAL.fiscalYear} budget by fund. A $0 fund early in a quarter means nothing has been recorded yet, not that it is off track.{" "}
        <span className="data-when">
          {feed
            ? `Live from the sheet · loaded ${loadedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : `Figures as of ${FISCAL.lastUpdated}`}
        </span>
      </p>

      {/* Fund groups */}
      {groups.map(({ group, items }) => (
        <section className="group" key={group} id={`g-${group.replace(/\s+/g, "-").toLowerCase()}`}>
          <div className="group-head">
            <div>
              <h2>
                <Icon name={GROUP_ICON[group] ?? "hand"} />
                {group}
              </h2>
              <p className="group-blurb">{GROUP_BLURB[group]}</p>
            </div>
            <span className="group-sum">
              {usd(items.reduce((s, r) => s + r.raised, 0))} <em>of {usd(items.reduce((s, r) => s + r.goal, 0))}</em>
            </span>
          </div>
          <div className="funds">
            {items.map((r) => (
              <FundCard key={r.name} r={r} view={view} />
            ))}
          </div>
        </section>
      ))}

      {/* Capital campaign */}
      <section className="group capital">
        <div className="group-head">
          <div>
            <h2>
              <Icon name="home" />
              Capital Campaign
            </h2>
            <p className="group-blurb">Tracked separately from the operating budget</p>
          </div>
        </div>
        <div className="funds">
          {capital.map((c) => {
            const raw = pctRaw(c.raised, c.annual);
            return (
              <article className="fund fund-capital" key={c.name}>
                <div className="fund-top">
                  <h3>{c.name}</h3>
                  <span className="badge badge-on">{raw}% funded</span>
                </div>
                <p className="fund-amt">
                  <strong>{usd(c.raised)}</strong>
                  <span>of {usd(c.annual)} goal</span>
                </p>
                <Bar value={raw} tone="gold" />
                <p className="fund-line fund-line-gap">{usd(Math.max(0, c.annual - c.raised))} still needed</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Donor wall */}
      <section className="group support">
        <div className="group-head">
          <div>
            <h2>Where Our Support Comes From</h2>
            <p className="group-blurb">{FISCAL.fiscalYear} to date</p>
          </div>
        </div>
        <div className="donors">
          {incomeColumns.map((col) => (
            <DonorCard key={col.label} col={col} />
          ))}
          <DonorCard col={government} />
        </div>
      </section>

      {/* Income mix */}
      <section className="group mix">
        <div className="group-head">
          <div>
            <h2>Income Mix: Current vs. Goal</h2>
            <p className="group-blurb">
              The goal is the balance of funding sources SLCM is working toward, so no single source carries the budget.
            </p>
          </div>
        </div>
        <div className="mix-card">
          <MixBar label="Current" slices={INCOME_MIX.current} />
          <MixBar label="Goal" slices={INCOME_MIX.goal} />
          <table className="mix-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Current</th>
                <th>Goal</th>
              </tr>
            </thead>
            <tbody>
              {INCOME_MIX.current.map((s, i) => (
                <tr key={s.source}>
                  <td>
                    <span className="swatch" style={{ background: MIX_COLORS[i] }} />
                    {s.source}
                  </td>
                  <td>{s.pct}%</td>
                  <td>{INCOME_MIX.goal[i].pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mix-caveat">Planning figures from SLCM's budget draft; not yet reconciled to the income worksheet.</p>
        </div>
      </section>

      {/* Spotlights */}
      <section className="group">
        <div className="group-head">
          <div>
            <h2>Spotlights</h2>
          </div>
        </div>
        <div className="spots">
          {SPOTLIGHTS.map((s) => (
            <article className="spot" key={s.title}>
              <span className="spot-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p className="spot-amount">{s.amount}</p>
              <p className="spot-blurb">{s.blurb}</p>
            </article>
          ))}
          <article className="spot spot-cta">
            <span className="spot-tag">Give to a fund</span>
            <h3>Every gift moves a bar</h3>
            <p className="spot-blurb">Choose a fund above, then name it in the comment box when you give.</p>
            <a className="give" href={LINKS.give} target="_blank" rel="noopener noreferrer">
              Give now
            </a>
          </article>
        </div>
      </section>

      <footer className="foot">
        <p>
          Design preview only. Numbers match the live Budget Tracker and update from the same sheet.
        </p>
      </footer>

    </div>
  );
}

const CSS = `
.pv {
  --evergreen: #185B43;
  --green: #24835F;
  --sage: #E7F1E9;
  --sage-deep: #CFE3D5;
  --ivory: #F7F8F4;
  --gold: #D6A63A;
  --gold-soft: #FBF6E8;
  --gold-line: #EAD9A8;
  --slate: #52645D;
  --ink: #16241D;
  --line: #DCE5DF;
  --card: #FFFFFF;
  --shadow: 0 1px 2px rgba(24,91,67,.06), 0 8px 24px rgba(24,91,67,.07);
  --radius: 16px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 64px;
  background: var(--ivory);
  color: var(--ink);
  font-family: Inter, "Source Sans 3", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
.pv * { box-sizing: border-box; }
.pv h1, .pv h2, .pv h3 { color: var(--evergreen); }

.preview-banner {
  font-size: 13px;
  color: var(--slate);
  background: #fff;
  border: 1px dashed var(--gold);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 22px;
}
.preview-banner a { color: var(--green); font-weight: 700; }

.ico { display: inline-flex; width: 18px; height: 18px; vertical-align: -3px; color: var(--green); }
.ico svg { width: 100%; height: 100%; }

/* Header */
.eyebrow { text-transform: uppercase; letter-spacing: .09em; font-size: 11px; font-weight: 700; color: var(--green); margin: 0 0 8px; }
.head h1 { font-size: 40px; line-height: 1.02; letter-spacing: -0.02em; margin: 0; font-weight: 800; }
.head .sub { margin: 10px 0 0; color: var(--slate); font-size: 15px; font-weight: 600; }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.toggle { display: inline-flex; background: #fff; border: 1px solid var(--line); border-radius: 999px; padding: 4px; box-shadow: var(--shadow); }
.toggle button { border: 0; background: transparent; color: var(--slate); font: inherit; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 999px; cursor: pointer; }
.toggle button.on { background: var(--green); color: #fff; }

/* Hero */
.hero {
  margin-top: 24px;
  background: linear-gradient(135deg, #185B43, #1E6E50);
  color: #fff;
  border-radius: var(--radius);
  padding: 26px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 12px 32px rgba(24,91,67,.22);
}
.hero-label { font-size: 13px; font-weight: 600; opacity: .85; }
.hero-raised { font-size: 48px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; }
.hero-of { font-size: 15px; opacity: .9; margin-bottom: 10px; }
.hero-foot { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 8px; }
.hero-foot span:last-child { opacity: .85; font-weight: 600; }

/* Bars */
.bar { height: 8px; border-radius: 999px; background: rgba(22,36,29,.08); overflow: hidden; }
.bar-lg { height: 12px; background: rgba(255,255,255,.18); }
.bar span { display: block; height: 100%; border-radius: 999px; transition: width .4s ease; }
.bar-green span { background: var(--green); }
.bar-gold span { background: var(--gold); }
.bar-sage span { background: var(--sage-deep); }

/* Tiles */
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }
.tile {
  display: flex; flex-direction: column; gap: 4px;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px;
  text-decoration: none; color: inherit; box-shadow: var(--shadow);
  transition: transform .15s ease, box-shadow .15s ease;
}
.tile:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(24,91,67,.12); }
.tile-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--slate); }
.tile-fig { font-size: 24px; font-weight: 800; color: var(--evergreen); }
.tile-sub { font-size: 12.5px; color: var(--slate); }

.data-note {
  margin: 20px 0 0; padding: 12px 16px; font-size: 13px; line-height: 1.5; color: var(--slate);
  background: var(--sage); border-radius: 12px;
}
.data-tag { display: inline-block; margin-right: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; color: var(--evergreen); }
.data-when { display: block; margin-top: 4px; font-weight: 600; color: var(--evergreen); }

/* Groups */
.group { margin-top: 44px; }
.group-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
.group-head h2 { display: flex; align-items: center; gap: 10px; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.01em; }
.group-head h2 .ico { width: 22px; height: 22px; }
.group-blurb { margin: 4px 0 0; font-size: 13.5px; color: var(--slate); max-width: 60ch; }
.group-sum { font-size: 14px; font-weight: 800; color: var(--evergreen); }
.group-sum em { font-style: normal; font-weight: 600; color: var(--slate); }

.funds { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.fund {
  background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 18px 18px 16px; box-shadow: var(--shadow);
  display: flex; flex-direction: column; gap: 10px;
}
.fund-done { background: var(--sage); border-color: var(--sage-deep); }
.fund-gap { background: var(--gold-soft); border-color: var(--gold-line); }
.fund-capital { background: #fff; }
.fund-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.fund-top h3 { font-size: 15px; margin: 0; font-weight: 700; line-height: 1.3; }
.badge { flex-shrink: 0; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.badge-on { background: var(--sage); color: var(--evergreen); }
.badge-done { background: var(--green); color: #fff; }
.badge-gap { background: #fff; color: #9a7416; border: 1px solid var(--gold-line); }
.fund-amt { margin: 0; display: flex; align-items: baseline; gap: 8px; }
.fund-amt strong { font-size: 24px; font-weight: 800; color: var(--evergreen); letter-spacing: -0.01em; }
.fund-amt span { font-size: 13px; color: var(--slate); }
.fund-line { margin: 0; font-size: 12.5px; color: var(--slate); }
.fund-line-gap { color: #9a7416; font-weight: 600; }
.fund-line-done { color: var(--evergreen); font-weight: 600; }
.fund-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
.pill {
  display: inline-block; font: inherit; font-size: 12px; font-weight: 700; color: #fff; background: var(--green);
  border: 1px solid var(--green); border-radius: 999px; padding: 5px 12px; text-decoration: none; cursor: pointer;
}
.pill-ghost { background: transparent; color: var(--green); border-color: var(--sage-deep); }
.pill-ghost:hover, .pill-ghost.on { background: var(--sage); }
.fund-note { margin: 0; padding: 10px 12px; background: var(--sage); border-radius: 10px; font-size: 13px; line-height: 1.45; color: var(--ink); }
.fund-done .fund-note { background: #fff; }

.programs { list-style: none; margin: 6px 0 0; padding: 12px 0 0; border-top: 1px dashed var(--line); display: grid; gap: 10px; }
.program-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 12.5px; margin-bottom: 5px; }
.program-name { font-weight: 600; line-height: 1.3; }
.program-figs { white-space: nowrap; font-weight: 700; color: var(--evergreen); }
.program-figs em { font-style: normal; font-weight: 500; color: var(--slate); }
.programs .bar { height: 5px; }

/* Donor wall */
.donors { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.donor { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
.donor .ico { width: 36px; height: 36px; padding: 8px; background: var(--sage); border-radius: 10px; color: var(--evergreen); margin-bottom: 12px; }
.donor h3 { font-size: 14px; margin: 0; font-weight: 700; }
.donor-fig { margin: 6px 0 2px; font-size: 22px; font-weight: 800; color: var(--evergreen); }
.donor-blurb { margin: 0 0 10px; font-size: 13px; color: var(--slate); line-height: 1.4; }
.donor-list { list-style: none; margin: 12px 0 0; padding: 12px 0 0; border-top: 1px dashed var(--line); display: grid; gap: 6px; max-height: 320px; overflow: auto; }
.donor-list li { font-size: 13px; color: var(--ink); }
.monthly { display: inline-block; margin-left: 6px; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; font-weight: 800; color: var(--green); background: var(--sage); border-radius: 999px; padding: 1px 6px; vertical-align: 1px; }

/* Income mix */
.mix-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
.mix-row { display: grid; grid-template-columns: 70px 1fr; align-items: center; gap: 12px; margin-bottom: 12px; }
.mix-label { font-size: 13px; font-weight: 700; color: var(--slate); }
.mix-bar { display: flex; height: 22px; border-radius: 8px; overflow: hidden; gap: 2px; }
.mix-bar span { display: block; height: 100%; }
.mix-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
.mix-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--slate); padding: 6px 0; border-bottom: 1px solid var(--line); }
.mix-table th:not(:first-child), .mix-table td:not(:first-child) { text-align: right; width: 90px; }
.mix-table td { padding: 7px 0; border-bottom: 1px solid #eef2ef; font-weight: 600; }
.mix-table td:not(:first-child) { color: var(--evergreen); font-weight: 700; }
.swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; margin-right: 8px; vertical-align: -1px; }
.mix-caveat { margin: 12px 0 0; font-size: 12px; color: var(--slate); }

/* Spotlights */
.spots { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.spot { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
.spot-tag { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; color: var(--green); }
.spot h3 { font-size: 16px; margin: 8px 0 4px; font-weight: 800; }
.spot-amount { font-size: 26px; font-weight: 800; color: var(--evergreen); margin: 4px 0; }
.spot-blurb { font-size: 13px; color: var(--slate); margin: 6px 0 0; line-height: 1.45; }
.spot-cta { background: var(--sage); border-color: var(--sage-deep); }
.give { display: inline-block; margin-top: 14px; background: var(--green); color: #fff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 999px; }

.foot { margin-top: 44px; padding-top: 16px; border-top: 1px solid var(--line); }
.foot p { font-size: 12px; color: var(--slate); line-height: 1.5; margin: 0; }

@media (max-width: 640px) {
  .head h1 { font-size: 32px; }
  .hero-raised { font-size: 38px; }
  .hero { padding: 22px 20px; }
}
`;
