import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { reportHtml, safeFileName } from './report-html'
import type { Profile, Session } from './types'

export { reportHtml } from './report-html'

export async function exportPdf(
  sessions: Session[],
  profile: Profile,
  periodLabel: string,
): Promise<void> {
  const html = reportHtml(sessions, profile, periodLabel)
  const printed = await Print.printToFileAsync({ html, base64: true })
  if (!printed.base64) {
    throw new Error('Could not generate the PDF.')
  }

  const dest = `${FileSystem.cacheDirectory}${safeFileName(periodLabel)}.pdf`
  await FileSystem.writeAsStringAsync(dest, printed.base64, { encoding: 'base64' })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export training costs',
      UTI: 'com.adobe.pdf',
    })
  }
}
