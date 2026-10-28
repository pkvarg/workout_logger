import { cost, entryDate, hoursLabel, money } from './format'
import type { Profile, Session } from './types'

function esc(value: string): string {
  return String(value).replace(/[&<>"]/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      default:
        return '&quot;'
    }
  })
}

export function safeFileName(periodLabel: string): string {
  return (
    `studio-ledger-${periodLabel}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'studio-ledger'
  )
}

export function reportHtml(sessions: Session[], profile: Profile, periodLabel: string): string {
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  const currency = profile.currency
  const total = ordered.reduce((sum, s) => sum + cost(s), 0)
  const hours = ordered.reduce((sum, s) => sum + s.hours, 0)

  const rows = ordered
    .map(
      (s) => `
        <tr>
          <td>${esc(entryDate(s.date, currency))}</td>
          <td>${esc(s.activity)}</td>
          <td class="num">${hoursLabel(s.hours)}</td>
          <td class="num">${esc(money(s.rate, currency, true))}</td>
          <td class="num strong">${esc(money(cost(s), currency, true))}</td>
        </tr>`,
    )
    .join('')

  const empty = `<tr><td colspan="5" class="empty">No sessions in this period.</td></tr>`

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Figtree:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --ink: #241b22;
        --muted: #8a7b82;
        --line: #ece2db;
        --accent: #d1316b;
        --soft: #fce7ee;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 40px 36px;
        color: var(--ink);
        font-family: 'Figtree', -apple-system, Helvetica, Arial, sans-serif;
        font-size: 13px;
      }
      .mark {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 600;
        font-style: italic;
        color: var(--accent);
        font-size: 16px;
      }
      h1 {
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 500;
        font-size: 30px;
        margin: 6px 0 2px;
        letter-spacing: -0.01em;
      }
      .sub { color: var(--muted); font-size: 13px; }
      .totals {
        display: flex;
        gap: 14px;
        margin: 26px 0 22px;
      }
      .tile {
        flex: 1;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 16px 18px;
      }
      .tile.lead { background: var(--accent); border-color: var(--accent); color: #fff; }
      .tile .k { font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.75; }
      .tile .v { font-family: 'Fraunces', Georgia, serif; font-weight: 500; font-size: 26px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      th {
        text-align: left;
        font-size: 10.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted);
        padding: 0 10px 8px;
        border-bottom: 1.5px solid var(--line);
      }
      td { padding: 11px 10px; border-bottom: 1px solid var(--line); }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .strong { font-weight: 600; }
      .empty { text-align: center; color: var(--muted); padding: 30px; }
      tfoot td {
        border-top: 1.5px solid var(--ink);
        border-bottom: none;
        font-weight: 700;
        padding-top: 12px;
      }
      .foot {
        margin-top: 28px;
        color: var(--muted);
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="mark">Studio Ledger</div>
    <h1>Training costs</h1>
    <div class="sub">${esc(profile.name || '')}${profile.name ? ' · ' : ''}${esc(periodLabel)}</div>

    <div class="totals">
      <div class="tile lead">
        <div class="k">Total spent</div>
        <div class="v">${esc(money(total, currency))}</div>
      </div>
      <div class="tile">
        <div class="k">Hours</div>
        <div class="v">${hoursLabel(hours)}</div>
      </div>
      <div class="tile">
        <div class="k">Sessions</div>
        <div class="v">${ordered.length}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Activity</th>
          <th class="num">Hours</th>
          <th class="num">Rate</th>
          <th class="num">Cost</th>
        </tr>
      </thead>
      <tbody>
        ${ordered.length ? rows : empty}
      </tbody>
      ${
        ordered.length
          ? `<tfoot>
        <tr>
          <td colspan="2">Total</td>
          <td class="num">${hoursLabel(hours)}</td>
          <td></td>
          <td class="num">${esc(money(total, currency))}</td>
        </tr>
      </tfoot>`
          : ''
      }
    </table>

    <div class="foot">Generated by Studio Ledger · ${esc(entryDate(new Date().toISOString(), currency))}</div>
  </body>
</html>`
}
