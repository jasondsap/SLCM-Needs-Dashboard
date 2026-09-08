"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * SLCM Budget Tracking Dashboard
 * ------------------------------
 * Companion to the SLCM Needs dashboard. Tracks the fiscal-year budget by
 * category against what's actually been raised, with a quarterly and annual
 * view plus an income-mix breakdown (Current vs. Goal).
 *
 * DATA SOURCE: when BUDGET_FEED_CSV_URL is set, the expense categories, the
 * capital campaign, and the donor wall are fetched live from a published
 * Google Sheet (see "Live feed" below). The static CATEGORIES / CAPITAL /
 * INCOME_COLUMNS constants are the fallback whenever the feed is empty,
 * unreachable, or unparseable, and they also supply the things the sheet
 * does not carry (group, link, column totals).
 *
 * The static operating numbers are Clare's "Budget Tracker - Expenses"
 * worksheet as of 7/13. Income-mix percentages are from her Canva draft.
 */

// ---- Fiscal context -------------------------------------------------------
const FISCAL = {
  quarterLabel: "Quarter 1 · July 1 – September 30",
  fiscalYear: "FY 2026–27",
  lastUpdated: "July 13, 2026",
};

const LINKS = {
  give: "https://slcm.org/give",
  staff: "https://slcm.org/staff",
};

// Individual donor names come from Clare's "Income Categories" worksheet. This
// page is unlisted, but flip to false if the donor wall needs to go name-free
// before it is shown outside the Board.
const SHOW_INDIVIDUAL_DONOR_NAMES = true;

// ---- Live feed (Google Sheet) ---------------------------------------------
// Published-to-web CSV link of the "SLCM Budget Dashboard Feed" sheet. That
// sheet is a one-tab mirror, via IMPORTRANGE, of the two public-safe tabs in
// Clare's "Budget Tracking Spreadsheet":
//   columns A..I  = "Budget Tracker - Expenses"  (name, annual, quarterly, raised)
//   columns K..M  = "Budget Tracker - Income Categories" (Name, Category, Month)
// Never publish Clare's workbook itself: it holds salary and grant tabs.
// Leave empty to render the static figures below.
const BUDGET_FEED_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3gNloyUPkXrjXoMNo0-EExP9B5EfyMLM8219aTvXMn5xJAt6c3AbLcb0Y2d74JbIgWYxi8xQOWFwi/pub?gid=172529556&single=true&output=csv";
// Optional: if the donor list lives on its own published tab, put that CSV
// link here. Otherwise it is read from the feed above.
const BUDGET_DONORS_CSV_URL = "";

// ---- Operating categories (REAL DATA) -------------------------------------
// raised = "How much raised 7/13"; qGoal = projected quarterly goal; annual = projected annual
type Category = {
  name: string;
  annual: number;
  qGoal: number;
  raised: number;
  group: string;
  link?: string;
};

const CATEGORIES: Category[] = [
  { name: "Staff / Team Compensation", annual: 613060, qGoal: 153265, raised: 40000, group: "People", link: LINKS.staff },
  { name: "Health Care & Staff Benefits", annual: 179813, qGoal: 44953, raised: 6868, group: "People" },
  { name: "Administrative Costs", annual: 53744, qGoal: 13436, raised: 750, group: "Operations" },
  { name: "Accessibility: Interpretation & Ride Share", annual: 5000, qGoal: 1250, raised: 0, group: "Direct Assistance" },
  { name: "Barrier Fund", annual: 80000, qGoal: 20000, raised: 2135, group: "Direct Assistance" },
  { name: "Utilities Assistance", annual: 112500, qGoal: 28125, raised: 515, group: "Direct Assistance" },
  { name: "Housing Assistance", annual: 35000, qGoal: 8750, raised: 463, group: "Direct Assistance" },
  { name: "TARC Passes", annual: 8500, qGoal: 2125, raised: 0, group: "Direct Assistance" },
  { name: "Food Purchases", annual: 25000, qGoal: 6250, raised: 0, group: "Direct Assistance" },
  { name: "Household / Hygiene Supplies", annual: 25000, qGoal: 6250, raised: 0, group: "Direct Assistance" },
  { name: "Infant Supplies", annual: 15000, qGoal: 3750, raised: 0, group: "Direct Assistance" },
  { name: "KYnship Stipends", annual: 60000, qGoal: 15000, raised: 11893, group: "Direct Assistance" },
  { name: "Home from the Start Assistance", annual: 30000, qGoal: 7500, raised: 4095, group: "Direct Assistance" },
  { name: "Program Expenses", annual: 25450, qGoal: 6363, raised: 0, group: "Operations" },
  { name: "SLCM Building Expenses", annual: 59025, qGoal: 14756, raised: 0, group: "Operations" },
  { name: "Communications", annual: 10800, qGoal: 2700, raised: 0, group: "Operations" },
  { name: "Events: Families Helping Families & Taste of South Louisville", annual: 37000, qGoal: 9250, raised: 0, group: "Development" },
];

const CAPITAL = [
  { name: "Beechmont Club — Purchase", annual: 200000, raised: 0 },
  { name: "Beechmont Club — Renovations", annual: 150000, raised: 0 },
];

// ---- Income sources: donor wall (Canva p.2) -------------------------------
// Columns and the two known totals come from Clare's Canva page 2. Donor names
// come from the "Income Categories" worksheet, mapped to her column labels:
//   Churches = Institutional Giving · Donations = Individual Donor
// Corporate Giving names exist ONLY in the Canva (no rows in the worksheet);
// Earned Income has one entry in the "Income totals as of 7/13" tab.
// total: null = Clare has not supplied a figure yet — rendered as pending,
// never invented.
type Donor = { name: string; monthly?: boolean };
type IncomeColumn = { label: string; total: number | null; donors: Donor[] };

const INCOME_COLUMNS: IncomeColumn[] = [
  {
    label: "Corporate Giving",
    total: 18400,
    donors: [
      { name: "LG&E and KU Energy" },
      { name: "Louisville Water Company" },
      { name: "Taylor Blvd. Save-A-Lot" },
    ],
  },
  {
    label: "Churches",
    total: null,
    donors: [{ name: "Second Presbyterian Church" }, { name: "Ninth & O Baptist Church" }],
  },
  {
    label: "Donations",
    total: null,
    donors: [
      { name: "Jerry and Madeline Abramson" },
      { name: "Tracie Anderson" },
      { name: "Susan Applegate" },
      { name: "Debra Braaksma", monthly: true },
      { name: "Becky Burnside" },
      { name: "Marianne Butler" },
      { name: "Charles Caffey" },
      { name: "Louis and Margie Clark" },
      { name: "Lydia Cox", monthly: true },
      { name: "Kate Cunningham" },
      { name: "Jim and Marda Dewey" },
      { name: "Amy Elam-Krizan", monthly: true },
      { name: "John and Catherine Ford" },
      { name: "Dan Franklin" },
      { name: "John Garrison", monthly: true },
      { name: "LG Ebel Endowment" },
      { name: "Mary Martin-Mabry", monthly: true },
      { name: "Jason Matthews", monthly: true },
      { name: "Melanie McCool" },
      { name: "Jennifer Nunn", monthly: true },
      { name: "Linda Parry", monthly: true },
      { name: "Loren Powell and Ilse Apestegui", monthly: true },
      { name: "Shannon Queenan and Don Pitts", monthly: true },
      { name: "Ann Ramser" },
      { name: "Deanna and James Ray" },
      { name: "Nancy Robinson" },
      { name: "Beth Sample" },
      { name: "William and Mary Alice Stewart" },
      { name: "Stephen Stormes and Susan Rogers" },
      { name: "Jim Thornberry" },
      { name: "James Todd", monthly: true },
      { name: "Mary Jane Weber" },
      { name: "Dennis and Denise Weber" },
      { name: "James Welding" },
    ],
  },
  {
    label: "Philanthropy",
    total: null,
    donors: [
      { name: "Eleemosynary by LMH" },
      { name: "Gheens Foundation" },
      { name: "Jewish Heritage Fund" },
      { name: "Sisters of Charity of Nazareth" },
    ],
  },
  {
    label: "Earned Income",
    total: null,
    donors: [{ name: "Rosewater Sales" }],
  },
];

const GOVERNMENT: IncomeColumn = {
  label: "Our Government Partners",
  total: 144000,
  donors: [{ name: "Louisville Metro Government" }],
};

// ---- Income mix donuts (Canva p.3) ----------------------------------------
// These percentages are Clare's own figures from the Canva draft — not invented
// here — but they have not been reconciled against the income worksheet.
type Slice = { source: string; pct: number; color: string };

const INCOME_MIX: { current: Slice[]; goal: Slice[] } = {
  current: [
    { source: "Government", pct: 22.6, color: "#2f7d5b" },
    { source: "Philanthropy", pct: 24.5, color: "#4c9f70" },
    { source: "Corporate / Institutional", pct: 22.9, color: "#7bbf8f" },
    { source: "Individual Donors", pct: 21.6, color: "#c9a227" },
    { source: "Earned Income", pct: 8.4, color: "#e0b94a" },
  ],
  goal: [
    { source: "Government", pct: 20.3, color: "#2f7d5b" },
    { source: "Philanthropy", pct: 20.0, color: "#4c9f70" },
    { source: "Corporate / Institutional", pct: 22.9, color: "#7bbf8f" },
    { source: "Individual Donors", pct: 20.0, color: "#c9a227" },
    { source: "Earned Income", pct: 16.7, color: "#e0b94a" },
  ],
};

const SPOTLIGHTS = [
  {
    title: "Jewish Heritage Fund",
    amount: "$100,000",
    blurb: "Anticipated grant support anchoring staff and KYnship stipends this year.",
    tag: "Grant Spotlight",
  },
  {
    title: "Home from the Start",
    amount: "$30,000",
    blurb: "Family stipends helping households move from crisis to stability.",
    tag: "Program Spotlight",
  },
];

// ---- Live feed parsing ----------------------------------------------------
// Everything is located by header text (case-insensitive prefix match), so
// column order in Clare's sheet can change and the "How much raised 7/13"
// header can be re-dated without breaking anything.

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

const toNumber = (s: string | undefined) => {
  const n = parseFloat((s || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// "Household/hygiene Supplies" == "Household / Hygiene Supplies", "&" == "and"
const norm = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

const findCol = (headers: string[], prefix: string) =>
  headers.findIndex((h) => h.toLowerCase().startsWith(prefix));

// Group for a category the static list does not know about.
function groupFor(name: string): string {
  const n = name.toLowerCase();
  if (/staff|team|health|benefit|compensation/.test(n)) return "People";
  if (/event|campaign|fundrais|communication|marketing/.test(n)) return "Development";
  if (/assist|fund|pass|purchase|suppl|stipend|accessib|barrier|housing|food/.test(n))
    return "Direct Assistance";
  return "Operations";
}

// Which donor-wall column a sheet Category belongs in (null = not shown).
function donorColumnFor(category: string): string | null {
  const c = category.toLowerCase();
  if (c.includes("individual")) return "Donations";
  if (c.includes("institutional") || c.includes("church")) return "Churches";
  if (c.includes("government")) return GOVERNMENT.label;
  if (c.includes("corporate") || c.includes("business")) return "Corporate Giving";
  if (c.includes("earned")) return "Earned Income";
  if (c.includes("philanthrop") || c.includes("foundation") || c.includes("grant")) return "Philanthropy";
  return null;
}

// "john garrison" -> "John Garrison"; names with any capitals are left alone.
const tidyName = (s: string) =>
  s === s.toLowerCase() ? s.replace(/(^|[\s-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase()) : s;

// Sort key: surname of the first person named.
//   "Loren Powell and Ilse Apestegui" -> "powell"; "Jim and Marda Dewey" -> "dewey".
const surnameKey = (name: string) => {
  const first = name.split(/\s+and\s+|\s*&\s*/i)[0].trim().split(/\s+/);
  const all = name.trim().split(/\s+/);
  const key = first.length > 1 ? first[first.length - 1] : all[all.length - 1];
  return (key || name).toLowerCase();
};

type CapitalItem = { name: string; annual: number; raised: number };
type Feed = {
  categories: Category[];
  capital: CapitalItem[];
  donorsByColumn: Record<string, Donor[]>;
};

export function parseFeed(text: string): Feed | null {
  const rows = parseCSV(text);

  // -- Expenses: header row is the one carrying "Projected Annual ..."
  const hIdx = rows.findIndex((r) => findCol(r, "projected annual") >= 0);
  if (hIdx < 0) return null;
  const headers = rows[hIdx];
  const annualCol = findCol(headers, "projected annual");
  const qGoalCol = findCol(headers, "projected quarterly");
  const raisedCol = findCol(headers, "how much raised");
  const linkCol = findCol(headers, "link");
  if (raisedCol < 0) return null;
  // Clare leaves the name column's header blank; it sits just left of the annual column.
  const nameCol = Math.max(0, annualCol - 1);

  const categories: Category[] = [];
  const capital: CapitalItem[] = [];
  for (const r of rows.slice(hIdx + 1)) {
    const rawName = (r[nameCol] || "").trim();
    if (!rawName) continue;
    const annual = toNumber(r[annualCol]);
    if (annual <= 0) continue;
    const raised = toNumber(r[raisedCol]);

    const cap = rawName.match(/^capital campaign:?\s*(.+)$/i);
    if (cap) {
      const known = CAPITAL.find((c) => norm(c.name) === norm(cap[1]));
      capital.push({ name: known?.name ?? cap[1].trim(), annual, raised });
      continue;
    }

    const known = CATEGORIES.find((c) => norm(c.name) === norm(rawName));
    const sheetLink = linkCol >= 0 ? r[linkCol] || "" : "";
    const qGoal = qGoalCol >= 0 ? toNumber(r[qGoalCol]) : 0;
    categories.push({
      name: known?.name ?? rawName,
      annual,
      qGoal: qGoal > 0 ? qGoal : annual / 4,
      raised,
      group: known?.group ?? groupFor(rawName),
      link: /^https?:\/\//i.test(sheetLink) ? sheetLink : known?.link,
    });
  }
  if (categories.length === 0) return null;

  // -- Donor wall: header row carrying both "Name" and "Category"
  const donorsByColumn: Record<string, Donor[]> = {};
  const dIdx = rows.findIndex((r) => {
    const l = r.map((c) => c.toLowerCase());
    return l.includes("name") && l.includes("category");
  });
  if (dIdx >= 0) {
    const dh = rows[dIdx].map((c) => c.toLowerCase());
    const nCol = dh.indexOf("name");
    const cCol = dh.indexOf("category");
    const seen = new Map<string, Donor>();
    for (const r of rows.slice(dIdx + 1)) {
      const name = (r[nCol] || "").trim();
      const category = (r[cCol] || "").trim();
      if (!name || !category) continue;
      const column = donorColumnFor(category);
      if (!column) continue;
      const monthly = category.toLowerCase().includes("monthly");
      const key = column + "|" + norm(name);
      const existing = seen.get(key);
      if (existing) {
        if (monthly) existing.monthly = true;
        continue;
      }
      const donor: Donor = monthly ? { name: tidyName(name), monthly: true } : { name: tidyName(name) };
      seen.set(key, donor);
      (donorsByColumn[column] = donorsByColumn[column] || []).push(donor);
    }
    Object.values(donorsByColumn).forEach((list) =>
      list.sort((a, b) => surnameKey(a.name).localeCompare(surnameKey(b.name)))
    );
  }

  return { categories, capital, donorsByColumn };
}

async function fetchFeed(): Promise<Feed | null> {
  const urls = [BUDGET_FEED_CSV_URL, BUDGET_DONORS_CSV_URL].filter(Boolean);
  const texts = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Budget feed fetch failed: ${res.status}`);
      return res.text();
    })
  );
  return parseFeed(texts.join("\n"));
}

// ---- Helpers --------------------------------------------------------------
const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const pct = (raised: number, goal: number) => (goal <= 0 ? 0 : Math.min(100, Math.round((raised / goal) * 100)));

// Segmented red→green meter that fills based on % (honors Clare's Canva language)
function Meter({ value }: { value: number }) {
  // 5 segments, red -> green; a marker sits at the fill point
  const segments = ["#d1483f", "#e08a3c", "#e8c341", "#a7c957", "#4c9f70"];
  const filledCount = Math.max(0, Math.min(5, Math.ceil((value / 100) * 5)));
  return (
    <div className="meter" role="img" aria-label={`${value}% funded`}>
      <div className="meter-track">
        {segments.map((c, i) => (
          <span
            key={i}
            className="meter-seg"
            style={{
              background: i < filledCount ? c : "#e7ebe8",
              opacity: i < filledCount ? 1 : 1,
            }}
          />
        ))}
      </div>
      <div className="meter-marker" style={{ left: `calc(${value}% )` }} aria-hidden>
        <span className="meter-drop" />
      </div>
    </div>
  );
}

// Simple SVG donut for income mix
function Donut({ data, title }: { data: Slice[]; title: string }) {
  const radius = 70;
  const stroke = 34;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <figure className="donut">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label={`${title} income mix`}>
        <g transform="translate(90,90) rotate(-90)">
          {data.map((d, i) => {
            const len = (d.pct / 100) * circ;
            const seg = (
              <circle
                key={i}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </g>
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  );
}

export default function SLCMBudgetDashboard() {
  const [view, setView] = useState<"quarter" | "annual">("quarter");
  const [feed, setFeed] = useState<Feed | null>(null);

  // Live data: any failure leaves `feed` null and the static figures render.
  useEffect(() => {
    if (!BUDGET_FEED_CSV_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const parsed = await fetchFeed();
        if (!parsed) throw new Error("Budget feed did not contain the expected headers");
        if (!cancelled) setFeed(parsed);
      } catch (err) {
        console.error("Budget feed unavailable; showing static figures.", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = feed?.categories ?? CATEGORIES;
  const capital = feed?.capital ?? CAPITAL;
  // Column labels and totals stay static (the sheet has no totals); names come
  // from the sheet when it lists any for that column, else the static list.
  const incomeColumns = useMemo(
    () =>
      INCOME_COLUMNS.map((col) => ({
        ...col,
        donors: feed?.donorsByColumn[col.label]?.length ? feed.donorsByColumn[col.label] : col.donors,
      })),
    [feed]
  );
  const government = useMemo(
    () => ({
      ...GOVERNMENT,
      donors: feed?.donorsByColumn[GOVERNMENT.label]?.length
        ? feed.donorsByColumn[GOVERNMENT.label]
        : GOVERNMENT.donors,
    }),
    [feed]
  );

  const rows = useMemo(() => {
    return categories.map((c) => {
      const goal = view === "quarter" ? c.qGoal : c.annual;
      return { ...c, goal, funded: pct(c.raised, goal) };
    });
  }, [view, categories]);

  const totals = useMemo(() => {
    const goal = rows.reduce((s, r) => s + r.goal, 0);
    const raised = rows.reduce((s, r) => s + r.raised, 0);
    return { goal, raised, funded: pct(raised, goal) };
  }, [rows]);

  const groups = useMemo(() => {
    const order = ["People", "Direct Assistance", "Operations", "Development"];
    const map: Record<string, typeof rows> = {};
    rows.forEach((r) => {
      (map[r.group] = map[r.group] || []).push(r);
    });
    return order.filter((g) => map[g]).map((g) => ({ group: g, items: map[g] }));
  }, [rows]);

  return (
    <div className="wrap">
      {/* dangerouslySetInnerHTML avoids a hydration mismatch: React escapes the
          quotes inside font-family differently on the server than the client. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <header className="head">
        <div className="head-row">
          <div>
            <p className="eyebrow">South Louisville Community Ministries · {FISCAL.fiscalYear}</p>
            <h1>Budget Tracker</h1>
            <p className="sub">
              Where we are against our fundraising goals — by fund, this quarter and across the year.
            </p>
            <p className="give-note">
              Want to give to a specific fund?{" "}
              <a href={LINKS.give} target="_blank" rel="noopener noreferrer">
                Give here
              </a>{" "}
              and name the fund in the comment section.
            </p>
          </div>
          <div className="toggle" role="tablist" aria-label="Time frame">
            <button
              role="tab"
              aria-selected={view === "quarter"}
              className={view === "quarter" ? "on" : ""}
              onClick={() => setView("quarter")}
            >
              Quarterly
            </button>
            <button
              role="tab"
              aria-selected={view === "annual"}
              className={view === "annual" ? "on" : ""}
              onClick={() => setView("annual")}
            >
              Annual
            </button>
          </div>
        </div>
        <p className="context">
          {view === "quarter" ? FISCAL.quarterLabel : `${FISCAL.fiscalYear} · Full Year`} ·{" "}
          <span className="muted">
            {feed ? "Live from the Budget Tracking Spreadsheet" : `Last updated ${FISCAL.lastUpdated}`}
          </span>
        </p>
      </header>

      {/* Roll-up */}
      <section className="rollup">
        <div className="rollup-fig">
          <span className="rollup-label">Raised {view === "quarter" ? "this quarter" : "this year"}</span>
          <span className="rollup-raised">{usd(totals.raised)}</span>
          <span className="rollup-of">of {usd(totals.goal)} goal</span>
        </div>
        <div className="rollup-meter">
          <div className="rollup-pct">{totals.funded}% funded</div>
          <Meter value={totals.funded} />
          <div className="rollup-scale">
            <span>$0</span>
            <span>{usd(totals.goal)}</span>
          </div>
        </div>
      </section>

      {/* Board context caption */}
      <p className="caption">
        <span className="caption-tag">Early Q1 snapshot</span>
        Reflects gifts recorded {feed ? "in the Budget Tracking Spreadsheet" : `as of ${FISCAL.lastUpdated}`}. Several funds have not yet
        reported activity this quarter, so a $0 meter means "not yet recorded," not
        "off track."
      </p>

      {/* Category groups */}
      {groups.map(({ group, items }) => (
        <section className="group" key={group}>
          <div className="group-head">
            <h2>{group}</h2>
            <span className="group-sum">
              {usd(items.reduce((s, r) => s + r.raised, 0))} / {usd(items.reduce((s, r) => s + r.goal, 0))}
            </span>
          </div>
          <div className="cards">
            {items.map((r) => (
              <article className="card" key={r.name}>
                <div className="card-top">
                  <h3>{r.name}</h3>
                  {r.link ? (
                    <a
                      className="learn"
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More
                    </a>
                  ) : (
                    <button className="info" title="Details coming soon" aria-label={`About ${r.name}`}>
                      i
                    </button>
                  )}
                </div>
                <Meter value={r.funded} />
                <div className="card-figs">
                  <span className="raised">{usd(r.raised)}</span>
                  <span className="goal">of {usd(r.goal)}</span>
                  <span className="pctbadge">{r.funded}%</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Capital campaign */}
      <section className="group capital">
        <div className="group-head">
          <h2>Capital Campaign</h2>
          <span className="group-tag">Tracked separately from operating budget</span>
        </div>
        <div className="cards">
          {capital.map((c) => (
            <article className="card" key={c.name}>
              <div className="card-top">
                <h3>{c.name}</h3>
              </div>
              <Meter value={pct(c.raised, c.annual)} />
              <div className="card-figs">
                <span className="raised">{usd(c.raised)}</span>
                <span className="goal">of {usd(c.annual)}</span>
                <span className="pctbadge">{pct(c.raised, c.annual)}%</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Where our support comes from — donor wall (Canva p.2) */}
      <section className="income">
        <div className="group-head">
          <h2>Where Our Support Comes From</h2>
          <span className="group-tag">{FISCAL.fiscalYear} to date</span>
        </div>

        <div className="donor-cols">
          {incomeColumns.map((col) => (
            <div className="donor-col" key={col.label}>
              <h3>{col.label}</h3>
              <p className={col.total === null ? "col-total pending" : "col-total"}>
                {col.total === null ? "Total pending" : `Total: ${usd(col.total)}`}
              </p>
              <ul>
                {col.label === "Donations" && !SHOW_INDIVIDUAL_DONOR_NAMES ? (
                  <li className="withheld">{col.donors.length} individual donors</li>
                ) : (
                  col.donors.map((d) => (
                    <li key={d.name}>
                      {d.name}
                      {d.monthly && <span className="monthly" title="Monthly donor">monthly</span>}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="gov">
          <div className="gov-head">
            <h3>{government.label}</h3>
            <span className="col-total">Total: {usd(government.total ?? 0)}</span>
          </div>
          <ul>
            {government.donors.map((d) => (
              <li key={d.name}>{d.name}</li>
            ))}
          </ul>
        </div>

        {/* Income mix donuts — Canva p.3, kept at the bottom of this section */}
        <div className="group-head mix-head">
          <h2>Income Mix: Current vs. Goal</h2>
        </div>
        <div className="donuts">
          <Donut data={INCOME_MIX.current} title="Current" />
          <Donut data={INCOME_MIX.goal} title="Goal" />
          <ul className="legend">
            {INCOME_MIX.current.map((d) => (
              <li key={d.source}>
                <span className="swatch" style={{ background: d.color }} />
                {d.source}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Spotlights */}
      <section className="spotlights">
        <div className="group-head">
          <h2>Spotlights</h2>
        </div>
        <div className="spot-grid">
          {SPOTLIGHTS.map((s) => (
            <article className="spot" key={s.title}>
              <span className="spot-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p className="spot-amount">{s.amount}</p>
              <p className="spot-blurb">{s.blurb}</p>
            </article>
          ))}
          <article className="spot spot-cta">
            <span className="spot-tag">Monthly Campaign</span>
            <h3>This is what we need</h3>
            <p className="spot-blurb">
              Give to a specific fund and note it in the comments — every gift moves a meter.
            </p>
            <a className="give" href={LINKS.give} target="_blank" rel="noopener noreferrer">
              Give now
            </a>
          </article>
        </div>
      </section>

    </div>
  );
}

const CSS = `
.wrap {
  --emerald: #1f7a54;
  --emerald-deep: #16593d;
  --amber: #c9a227;
  --ink: #17241d;
  --slate: #5c6b63;
  --line: #dde5e0;
  --bg: #f6f8f6;
  --card: #ffffff;
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 20px 60px;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap * { box-sizing: border-box; }

.eyebrow {
  text-transform: uppercase;
  letter-spacing: .09em;
  font-size: 11px;
  font-weight: 700;
  color: var(--emerald);
  margin: 0 0 6px;
}
.head h1 {
  font-size: 40px;
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin: 0;
  font-weight: 800;
  color: var(--emerald-deep);
}
.head .sub { margin: 8px 0 0; color: var(--slate); font-size: 15px; max-width: 46ch; }
.give-note { margin: 8px 0 0; font-size: 13px; color: var(--slate); max-width: 52ch; }
.give-note a { color: var(--emerald); font-weight: 700; }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.context { margin: 14px 0 0; font-size: 13px; font-weight: 600; color: var(--ink); }
.context .muted { color: var(--slate); font-weight: 500; }

.toggle {
  display: inline-flex;
  background: #eaf1ec;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px;
}
.toggle button {
  border: 0;
  background: transparent;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: var(--slate);
  cursor: pointer;
}
.toggle button.on { background: var(--emerald); color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.12); }

.rollup {
  margin-top: 22px;
  background: linear-gradient(135deg, var(--emerald) 0%, var(--emerald-deep) 100%);
  color: #fff;
  border-radius: 18px;
  padding: 26px 28px;
  display: grid;
  grid-template-columns: minmax(200px, 1fr) 2fr;
  gap: 28px;
  align-items: center;
}
.rollup-label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; opacity: .85; }
.rollup-raised { display: block; font-size: 38px; font-weight: 800; line-height: 1.05; margin: 4px 0; letter-spacing: -0.01em; }
.rollup-of { display: block; font-size: 14px; opacity: .9; }
.rollup-pct { font-size: 13px; font-weight: 700; margin-bottom: 10px; opacity: .95; }
.rollup-scale { display: flex; justify-content: space-between; font-size: 11px; opacity: .8; margin-top: 8px; }
.rollup .meter-track { background: rgba(255,255,255,.18); }
.rollup .meter-seg { }

/* Board context caption */
.caption {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin: 16px 0 0;
  padding: 12px 16px;
  background: #fbf9f0;
  border: 1px solid #ece2c4;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--slate);
}
.caption-tag {
  flex-shrink: 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .07em;
  font-weight: 800;
  color: var(--amber);
  background: #fff;
  border: 1px solid #ece2c4;
  border-radius: 999px;
  padding: 3px 10px;
}

/* Meter */
.meter { position: relative; padding-top: 2px; }
.meter-track {
  display: flex;
  gap: 3px;
  height: 16px;
  border-radius: 999px;
  overflow: hidden;
  padding: 0;
}
.meter-seg { flex: 1; border-radius: 3px; transition: background .3s ease; }
.meter-marker {
  position: relative;
  height: 0;
}
.meter-drop {
  position: absolute;
  top: 1px;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid var(--ink);
}

/* Groups */
.group { margin-top: 34px; }
.group-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; border-bottom: 2px solid var(--line); padding-bottom: 8px; margin-bottom: 16px; }
.group-head h2 { font-size: 18px; margin: 0; font-weight: 800; color: var(--emerald-deep); letter-spacing: -0.01em; }
.group-sum { font-size: 13px; font-weight: 700; color: var(--slate); font-variant-numeric: tabular-nums; }
.group-tag, .sample-tag { font-size: 12px; font-weight: 600; color: var(--slate); }
.sample-tag { color: var(--amber); }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 16px 14px;
  transition: box-shadow .2s ease, transform .2s ease;
}
.card:hover { box-shadow: 0 6px 18px rgba(22,89,61,.08); transform: translateY(-1px); }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 14px; min-height: 38px; }
.card-top h3 { font-size: 14px; margin: 0; font-weight: 700; line-height: 1.25; }
.info {
  flex-shrink: 0;
  width: 20px; height: 20px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #f2f6f3;
  color: var(--slate);
  font-size: 11px; font-weight: 800; font-style: italic;
  cursor: help;
  line-height: 1;
}
.learn {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--emerald);
  text-decoration: none;
  border: 1px solid #cfe4d6;
  background: #f2f9f4;
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
}
.learn:hover { background: #e6f3ea; }
.card-figs { display: flex; align-items: baseline; gap: 6px; margin-top: 12px; }
.card-figs .raised { font-size: 18px; font-weight: 800; color: var(--emerald-deep); font-variant-numeric: tabular-nums; }
.card-figs .goal { font-size: 12px; color: var(--slate); }
.card-figs .pctbadge { margin-left: auto; font-size: 12px; font-weight: 800; color: var(--amber); font-variant-numeric: tabular-nums; }

.capital .card { background: #fbf9f0; border-color: #ece2c4; }

/* Income — donor wall */
.income { margin-top: 40px; }

.donor-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
.donor-col { padding: 18px 16px; border-right: 1px solid var(--line); }
.donor-col:last-child { border-right: 0; }
.donor-col h3 {
  font-size: 14px;
  margin: 0;
  font-weight: 800;
  color: var(--emerald-deep);
  text-align: center;
}
.col-total {
  margin: 6px 0 14px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.col-total.pending {
  color: var(--amber);
  font-weight: 600;
  font-style: italic;
}
.donor-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.donor-col li {
  font-size: 12.5px;
  line-height: 1.35;
  color: var(--slate);
  text-align: center;
}
.donor-col li.withheld { font-style: italic; }
.monthly {
  display: inline-block;
  margin-left: 5px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-weight: 800;
  color: var(--emerald);
  background: #eef6f1;
  border-radius: 999px;
  padding: 1px 6px;
  vertical-align: 1px;
}

.gov {
  margin-top: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
}
.gov-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.gov-head h3 { font-size: 14px; margin: 0; font-weight: 800; color: var(--emerald-deep); }
.gov-head .col-total { margin: 0; }
.gov ul { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 6px; }
.gov li { font-size: 12.5px; color: var(--slate); }

.explainer {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 12px 16px;
  background: #fbf9f0;
  border: 1px dashed #ddcf9e;
  border-radius: 12px;
}
.explainer p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--slate); flex: 1; min-width: 240px; }
.explainer-tag {
  flex-shrink: 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .07em;
  font-weight: 800;
  color: var(--amber);
  background: #fff;
  border: 1px solid #ece2c4;
  border-radius: 999px;
  padding: 3px 10px;
}

.mix-head { margin-top: 34px; }
.donuts { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.donut { margin: 0; text-align: center; }
.donut figcaption { font-size: 13px; font-weight: 700; color: var(--slate); margin-top: 6px; }
.legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--ink); }
.swatch { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }

/* Spotlights */
.spotlights { margin-top: 40px; }
.spot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.spot { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
.spot-tag { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; color: var(--emerald); }
.spot h3 { font-size: 16px; margin: 8px 0 4px; font-weight: 800; }
.spot-amount { font-size: 24px; font-weight: 800; color: var(--emerald-deep); margin: 4px 0; }
.spot-blurb { font-size: 13px; color: var(--slate); margin: 6px 0 0; line-height: 1.4; }
.spot-cta { background: linear-gradient(135deg, #f2f9f4, #eaf4ee); border-color: #cfe4d6; }
.give { display: inline-block; margin-top: 12px; background: var(--emerald); color: #fff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 999px; }

.foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--line); }
.foot p { font-size: 12px; color: var(--slate); line-height: 1.5; margin: 0; }

@media (max-width: 640px) {
  .rollup { grid-template-columns: 1fr; }
  .head h1 { font-size: 32px; }
  .donor-col { border-right: 0; border-bottom: 1px solid var(--line); }
  .donor-col:last-child { border-bottom: 0; }
}
`;
