import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { cost, entryDate, hoursLabel, money } from './format'
import type { Palette } from './theme'
import { font, radius } from './theme'
import type { Session } from './types'

export function SessionRow({
  session,
  currency,
  c,
  onPress,
}: {
  session: Session
  currency: string
  c: Palette
  onPress: (s: Session) => void
}) {
  return (
    <Pressable
      onPress={() => onPress(session)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.accentSoft : 'transparent' },
      ]}
    >
      <View style={[styles.rowIco, { backgroundColor: c.accentSoft }]}>
        <Text style={{ fontSize: 19 }}>{session.icon ?? '•'}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>
          {session.activity}
        </Text>
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13, marginTop: 2 }}>
          {entryDate(session.date, currency)} · {hoursLabel(session.hours)}h
        </Text>
      </View>
      <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>
        {money(cost(session), currency)}
      </Text>
    </Pressable>
  )
}

export function ProgressRing({
  hours,
  goal,
  c,
  size = 92,
}: {
  hours: number
  goal: number
  c: Palette
  size?: number
}) {
  const stroke = 7
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(1, hours / Math.max(1, goal))
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.line}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={{ color: c.ink, fontFamily: font.displaySemi, fontSize: 18 }}>
          {hoursLabel(hours)}h
        </Text>
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 9.5 }}>of {goal}h</Text>
      </View>
    </View>
  )
}

export function StatCard({ value, label, c }: { value: string; label: string; c: Palette }) {
  return (
    <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.line }]}>
      <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 24 }}>{value}</Text>
      <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 11.5, marginTop: 3 }}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  rowIco: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMid: { flex: 1, minWidth: 0 },
  ringLabel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
})
