import React, { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Palette } from './theme'
import { font, radius } from './theme'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function CalendarPicker({
  c,
  bottomInset,
  visible,
  value,
  minISO,
  maxISO,
  title,
  onClose,
  onSelect,
}: {
  c: Palette
  bottomInset: number
  visible: boolean
  value: string
  minISO?: string
  maxISO?: string
  title: string
  onClose: () => void
  onSelect: (iso: string) => void
}) {
  const base = value ? parseISO(value) : new Date()
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() })

  useEffect(() => {
    const b = value ? parseISO(value) : new Date()
    setView({ y: b.getFullYear(), m: b.getMonth() })
  }, [value, visible])

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const disabled = (day: number) => {
    const iso = toISO(new Date(view.y, view.m, day))
    if (maxISO && iso > maxISO) return true
    if (minISO && iso < minISO) return true
    return false
  }

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  const viewMonth = `${view.y}-${String(view.m + 1).padStart(2, '0')}`
  const nextDisabled = maxISO ? viewMonth >= maxISO.slice(0, 7) : false

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.paper, paddingBottom: 24 + bottomInset }]}>
        <View style={[styles.grip, { backgroundColor: c.lineStrong }]} />
        <Text
          style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginBottom: 14 }}
        >
          {title}
        </Text>

        <View style={styles.header}>
          <Pressable onPress={() => shift(-1)} hitSlop={10} style={styles.chev}>
            <Text style={{ color: c.accentInk, fontSize: 22, fontFamily: font.semi }}>‹</Text>
          </Pressable>
          <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>
            {MONTHS[view.m]} {view.y}
          </Text>
          <Pressable
            onPress={() => !nextDisabled && shift(1)}
            hitSlop={10}
            style={[styles.chev, { opacity: nextDisabled ? 0.3 : 1 }]}
          >
            <Text style={{ color: c.accentInk, fontSize: 22, fontFamily: font.semi }}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={[styles.weekday, { color: c.muted }]}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={styles.cell} />
            const iso = toISO(new Date(view.y, view.m, day))
            const isSel = iso === value
            const off = disabled(day)
            return (
              <Pressable
                key={iso}
                disabled={off}
                onPress={() => {
                  onSelect(iso)
                  onClose()
                }}
                style={styles.cell}
              >
                <View style={[styles.dayDot, isSel && { backgroundColor: c.accent }]}>
                  <Text
                    style={{
                      color: off ? c.lineStrong : isSel ? c.onAccent : c.ink,
                      fontFamily: isSel ? font.bold : font.regular,
                      fontSize: 14.5,
                    }}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(20,8,14,0.42)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  grip: {
    width: 38,
    height: 4,
    borderRadius: 99,
    alignSelf: 'center',
    marginVertical: 6,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chev: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: font.semi, fontSize: 11.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
