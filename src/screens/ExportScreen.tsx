import DateTimePicker from '@react-native-community/datetimepicker'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { exportPdf } from '../export'
import { cost, entryDate, isSameMonth, money, monthKey, todayISO } from '../format'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Profile, Session } from '../types'

type Period = 'month' | 'all' | 'custom'

function firstOfMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function ExportScreen({
  c,
  profile,
  sessions,
  onClose,
}: {
  c: Palette
  profile: Profile
  sessions: Session[]
  onClose: () => void
}) {
  const [period, setPeriod] = useState<Period>('month')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(todayISO())
  const [showFrom, setShowFrom] = useState(false)
  const [showTo, setShowTo] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currency = profile.currency

  const filtered = useMemo(() => {
    if (period === 'all') return sessions
    if (period === 'month') return sessions.filter((s) => isSameMonth(s.date))
    const lo = from <= to ? from : to
    const hi = from <= to ? to : from
    return sessions.filter((s) => s.date >= lo && s.date <= hi)
  }, [period, sessions, from, to])

  const total = filtered.reduce((sum, s) => sum + cost(s), 0)

  const label = useMemo(() => {
    if (period === 'all') return 'All time'
    if (period === 'month') return monthKey(todayISO(), currency)
    const lo = from <= to ? from : to
    const hi = from <= to ? to : from
    return `${entryDate(lo, currency)} – ${entryDate(hi, currency)}`
  }, [period, from, to, currency])

  const run = async () => {
    setError(null)
    setBusy(true)
    try {
      await exportPdf(filtered, profile, label)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <View style={styles.head}>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 22 }}>
          Export PDF
        </Text>
        <Pressable onPress={onClose} style={[styles.x, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.muted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      </View>

      <Label c={c}>Period</Label>
      <View style={styles.chips}>
        {(
          [
            ['month', 'This month'],
            ['all', 'All time'],
            ['custom', 'Custom range'],
          ] as [Period, string][]
        ).map(([key, text]) => {
          const on = key === period
          return (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              style={[
                styles.chip,
                {
                  borderColor: on ? c.accent : c.line,
                  backgroundColor: on ? c.accentSoft : c.card,
                },
              ]}
            >
              <Text
                style={{ color: on ? c.accentInk : c.muted, fontFamily: font.semi, fontSize: 13 }}
              >
                {text}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {period === 'custom' && (
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Label c={c}>From</Label>
            <Pressable
              onPress={() => setShowFrom(true)}
              style={[styles.dateBtn, { backgroundColor: c.card, borderColor: c.line }]}
            >
              <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 14 }}>
                {entryDate(from, currency)}
              </Text>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Label c={c}>To</Label>
            <Pressable
              onPress={() => setShowTo(true)}
              style={[styles.dateBtn, { backgroundColor: c.card, borderColor: c.line }]}
            >
              <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 14 }}>
                {entryDate(to, currency)}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {showFrom && (
        <DateTimePicker
          value={new Date(from)}
          mode="date"
          maximumDate={new Date()}
          onChange={(_e, d) => {
            setShowFrom(Platform.OS === 'ios')
            if (d) setFrom(d.toISOString().slice(0, 10))
          }}
        />
      )}
      {showTo && (
        <DateTimePicker
          value={new Date(to)}
          mode="date"
          maximumDate={new Date()}
          onChange={(_e, d) => {
            setShowTo(Platform.OS === 'ios')
            if (d) setTo(d.toISOString().slice(0, 10))
          }}
        />
      )}

      <View style={[styles.summary, { backgroundColor: c.card, borderColor: c.line }]}>
        <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 28, marginTop: 4 }}>
          {money(total, currency)}
        </Text>
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 }}>
          {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}
        </Text>
      </View>

      {error && (
        <Text style={{ color: c.danger, fontFamily: font.medium, fontSize: 13, marginTop: 12 }}>
          {error}
        </Text>
      )}

      <Pressable
        onPress={run}
        disabled={busy || filtered.length === 0}
        style={({ pressed }) => [
          styles.save,
          {
            backgroundColor: c.accent,
            opacity: filtered.length === 0 ? 0.4 : pressed || busy ? 0.9 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>
            Export &amp; share PDF
          </Text>
        )}
      </Pressable>
      <Text
        style={{
          color: c.muted,
          fontFamily: font.regular,
          fontSize: 12,
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        Choose email, or “Save to Files”, from the share menu.
      </Text>
    </View>
  )
}

function Label({ c, children }: { c: Palette; children: string }) {
  return (
    <Text
      style={{
        color: c.muted,
        fontFamily: font.semi,
        fontSize: 12,
        marginTop: 16,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  x: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  row2: { flexDirection: 'row', gap: 12 },
  dateBtn: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  summary: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 20,
    marginTop: 22,
  },
  save: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
})
