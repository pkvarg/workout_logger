import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Palette } from './theme'
import { font, radius } from './theme'
import type { ExerciseKind } from './types'

export const KINDS: { kind: ExerciseKind; label: string; hint: string }[] = [
  { kind: 'weight', label: 'Weight', hint: 'kg × reps' },
  { kind: 'bodyweight', label: 'Bodyweight', hint: 'reps, optional +kg' },
  { kind: 'reps', label: 'Reps', hint: 'reps only' },
  { kind: 'time', label: 'Time', hint: 'minutes' },
]

export function kindLabel(kind: ExerciseKind): string {
  return KINDS.find((k) => k.kind === kind)?.label ?? 'Weight'
}

const num = (n: number): string => String(Math.round(n * 100) / 100)

export function minutesFromDuration(duration: number): string {
  return num(duration / 60)
}

export function formatSet(
  set: { weight: number; reps: number; duration: number },
  kind: ExerciseKind,
): string {
  if (kind === 'time') return `${minutesFromDuration(set.duration)} min`
  if (kind === 'reps') return `${set.reps} reps`
  if (kind === 'bodyweight')
    return set.weight > 0 ? `BW +${num(set.weight)} × ${set.reps}` : `BW × ${set.reps}`
  return `${num(set.weight)} kg × ${set.reps}`
}

export function KindSelector({
  c,
  value,
  onChange,
}: {
  c: Palette
  value: ExerciseKind
  onChange: (kind: ExerciseKind) => void
}) {
  return (
    <View style={styles.row}>
      {KINDS.map((k) => {
        const on = k.kind === value
        return (
          <Pressable
            key={k.kind}
            onPress={() => onChange(k.kind)}
            style={[
              styles.chip,
              {
                borderColor: on ? c.accent : c.line,
                backgroundColor: on ? c.accentSoft : 'transparent',
              },
            ]}
          >
            <Text
              style={{ color: on ? c.accentInk : c.muted, fontFamily: font.semi, fontSize: 12.5 }}
            >
              {k.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 12 },
})
