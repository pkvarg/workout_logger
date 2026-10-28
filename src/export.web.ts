import { reportHtml, safeFileName } from './report-html'
import type { Profile, Session } from './types'

export { reportHtml } from './report-html'

function printableDoc(html: string, title: string): string {
  const bar = `
    <div class="sl-print-bar" style="position:sticky;top:0;z-index:9999;display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;padding:12px 14px;background:#d1316b;font-family:Figtree,-apple-system,Helvetica,Arial,sans-serif;">
      <span style="color:#fff;font-size:13px;text-align:center;">To save on iPhone: <b>Share → Options → PDF → Save to Files</b></span>
      <button onclick="window.print()" style="border:0;border-radius:999px;padding:9px 16px;background:#fff;color:#d1316b;font-weight:700;font-size:13px;cursor:pointer;">Print / Save as PDF</button>
    </div>
    <style>@media print { .sl-print-bar { display:none !important; } }</style>`
  return html.replace('</head>', `<title>${title}</title></head>`).replace('<body>', '<body>' + bar)
}

export async function exportPdf(
  sessions: Session[],
  profile: Profile,
  periodLabel: string,
): Promise<void> {
  const doc = printableDoc(reportHtml(sessions, profile, periodLabel), safeFileName(periodLabel))

  const win = window.open('', '_blank')
  if (!win) {
    const blob = new Blob([doc], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
    return
  }
  win.document.open()
  win.document.write(doc)
  win.document.close()
}
