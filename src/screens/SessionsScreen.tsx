import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SessionRow } from '../components'
import { cost, money, monthKey } from '../format'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Session } from '../types'

export default function SessionsScreen({
  c,
  sessions,
  currency,
  onOpenSession,
  onExport,
}: {
  c: Palette
  sessions: Session[]
  currency: string
  onOpenSession: (s: Session) => void
  onExport: () => void
}) {
  const groups = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
    const map = new Map<string, Session[]>()
    for (const s of sorted) {
      const key = monthKey(s.date, currency)
      const bucket = map.get(key) ?? []
      bucket.push(s)
      map.set(key, bucket)
    }
    return [...map.entries()]
  }, [sessions, currency])

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13 }}>Your</Text>
          <Text
            style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginTop: 1 }}
          >
            Ledger
          </Text>
        </View>
        {sessions.length > 0 && (
          <Pressable
            onPress={onExport}
            style={[styles.exportBtn, { borderColor: c.line, backgroundColor: c.card }]}
          >
            <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 13 }}>
              Export PDF
            </Text>
          </Pressable>
        )}
      </View>

      {groups.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 50 }}>
          <Text
            style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 17, marginBottom: 4 }}
          >
            Your ledger is empty
          </Text>
          <Text
            style={{
              color: c.muted,
              fontFamily: font.regular,
              fontSize: 13.5,
              textAlign: 'center',
            }}
          >
            Everything you log gathers here, month by month.
          </Text>
        </View>
      ) : (
        groups.map(([label, items]) => {
          const tot = items.reduce((a, s) => a + cost(s), 0)
          return (
            <View key={label}>
              <View style={styles.monthLabel}>
                <Text
                  style={{
                    color: c.muted,
                    fontFamily: font.semi,
                    fontSize: 11,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </Text>
                <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 13 }}>
                  {money(tot, currency)}
                </Text>
              </View>
              {items.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  currency={currency}
                  c={c}
                  onPress={onOpenSession}
                />
              ))}
            </View>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  exportBtn: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  monthLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 16,
    marginBottom: 7,
    paddingHorizontal: 2,
  },
})
