import { reportHtml } from './report-html'
import type { Profile, Session } from './types'

export { reportHtml } from './report-html'

export async function exportPdf(
  sessions: Session[],
  profile: Profile,
  periodLabel: string,
): Promise<void> {
  const html = reportHtml(sessions, profile, periodLabel)
  const win = window.open('', '_blank')
  if (!win) {
    throw new Error('Please allow pop-ups for this site to export the PDF.')
  }
  win.document.open()
  win.document.write(html)
  win.document.close()

  const print = () => {
    win.focus()
    win.print()
  }
  if (win.document.readyState === 'complete') {
    setTimeout(print, 400)
  } else {
    win.onload = () => setTimeout(print, 400)
  }
}
