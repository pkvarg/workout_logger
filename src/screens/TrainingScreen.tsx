import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Polyline } from 'react-native-svg'
import { longDate } from '../format'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { TrainingPlan, Workout } from '../types'

type Section = 'plans' | 'history' | 'progress'

export default function TrainingScreen({
  c,
  currency,
  plans,
  workouts,
  onNewPlan,
  onDeletePlan,
  onRemoveWorkout,
}: {
  c: Palette
  currency: string
  plans: TrainingPlan[]
  workouts: Workout[]
  onNewPlan: () => void
  onDeletePlan: (id: string) => void
  onRemoveWorkout: (id: string) => void
}) {
  const [section, setSection] = useState<Section>('plans')

  return (
    <View>
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13 }}>Your</Text>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginTop: 1 }}>
          Training
        </Text>
      </View>

      <View style={[styles.segment, { backgroundColor: c.card, borderColor: c.line }]}>
        {(['plans', 'history', 'progress'] as Section[]).map((s) => {
          const on = section === s
          return (
            <Pressable
              key={s}
              onPress={() => setSection(s)}
              style={[styles.segBtn, on && { backgroundColor: c.accentSoft }]}
            >
              <Text
                style={{
                  color: on ? c.accentInk : c.muted,
                  fontFamily: font.semi,
                  fontSize: 13,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {section === 'plans' && (
        <PlansSection c={c} plans={plans} onNewPlan={onNewPlan} onDeletePlan={onDeletePlan} />
      )}
      {section === 'history' && (
        <HistorySection c={c} currency={currency} workouts={workouts} onRemove={onRemoveWorkout} />
      )}
      {section === 'progress' && <ProgressSection c={c} workouts={workouts} />}
    </View>
  )
}

function PlansSection({
  c,
  plans,
  onNewPlan,
  onDeletePlan,
}: {
  c: Palette
  plans: TrainingPlan[]
  onNewPlan: () => void
  onDeletePlan: (id: string) => void
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Pressable onPress={onNewPlan} style={[styles.newPlan, { borderColor: c.accent }]}>
        <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 14 }}>
          + New training plan
        </Text>
      </Pressable>

      {plans.length === 0 ? (
        <Empty
          c={c}
          title="No plans yet"
          body="Create a training plan — a set of exercises you want to do together. Then log a workout against it."
        />
      ) : (
        plans.map((p) => (
          <View key={p.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 16 }}>
                  {p.name}
                </Text>
                <Text
                  style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 }}
                >
                  {p.exercises.length} {p.exercises.length === 1 ? 'exercise' : 'exercises'}
                </Text>
              </View>
              <Pressable onPress={() => onDeletePlan(p.id)} hitSlop={8}>
                <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12 }}>Remove</Text>
              </Pressable>
            </View>
            {p.note ? (
              <Text
                style={{ color: c.muted, fontFamily: font.regular, fontSize: 13, marginTop: 6 }}
              >
                {p.note}
              </Text>
            ) : null}
            {p.exercises.length > 0 ? (
              <View style={styles.pills}>
                {p.exercises.map((ex) => (
                  <View key={ex.id} style={[styles.pill, { backgroundColor: c.accentSoft }]}>
                    <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 12.5 }}>
                      {ex.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  )
}

function HistorySection({
  c,
  currency,
  workouts,
  onRemove,
}: {
  c: Palette
  currency: string
  workouts: Workout[]
  onRemove: (id: string) => void
}) {
  if (workouts.length === 0) {
    return (
      <Empty
        c={c}
        title="No workouts yet"
        body="Tap the + button to log a workout — pick a plan and record your sets."
      />
    )
  }
  return (
    <View style={{ marginTop: 16 }}>
      {workouts.map((w) => (
        <WorkoutCard key={w.id} workout={w} c={c} currency={currency} onRemove={onRemove} />
      ))}
    </View>
  )
}

function WorkoutCard({
  workout,
  c,
  currency,
  onRemove,
}: {
  workout: Workout
  c: Palette
  currency: string
  onRemove: (id: string) => void
}) {
  const byExercise = groupByExercise(workout)
  const totalSets = workout.sets.length
  const volume = workout.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 16 }}>
            {workout.planName ?? 'Workout'}
          </Text>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 }}>
            {longDate(workout.date, currency)}
          </Text>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 }}>
            {totalSets} {totalSets === 1 ? 'set' : 'sets'} · {Math.round(volume).toLocaleString()}{' '}
            kg volume
          </Text>
        </View>
        <Pressable onPress={() => onRemove(workout.id)} hitSlop={8}>
          <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12 }}>Remove</Text>
        </Pressable>
      </View>

      {workout.note ? (
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13, marginTop: 6 }}>
          {workout.note}
        </Text>
      ) : null}

      <View style={{ marginTop: 12, gap: 12 }}>
        {byExercise.map((g) => (
          <View key={g.exercise}>
            <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 14, marginBottom: 6 }}>
              {g.name}
            </Text>
            <View style={styles.pills}>
              {g.sets.map((s) => (
                <View key={s.id} style={[styles.pill, { backgroundColor: c.accentSoft }]}>
                  <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 12.5 }}>
                    {s.weight}
                    <Text style={{ color: c.muted }}> kg × </Text>
                    {s.reps}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function ProgressSection({ c, workouts }: { c: Palette; workouts: Workout[] }) {
  const progress = useMemo(() => buildProgress(workouts), [workouts])

  if (progress.length === 0) {
    return (
      <Empty
        c={c}
        title="No progress yet"
        body="Log a few workouts and you'll see your best weights, estimated 1-rep-max and volume climb here."
      />
    )
  }

  return (
    <View style={{ marginTop: 16 }}>
      {progress.map((p) => (
        <View key={p.name} style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 16 }}>
            {p.name}
          </Text>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12, marginTop: 2 }}>
            {p.sessions.length} {p.sessions.length === 1 ? 'session' : 'sessions'}
          </Text>

          <View style={styles.statRow}>
            <Stat c={c} value={`${trim(p.topWeight)} kg`} label="TOP SET" />
            <Stat c={c} value={`${trim(p.best1rm)} kg`} label="EST. 1RM" />
            <Stat c={c} value={fmtK(p.totalVolume)} label="VOLUME" />
          </View>

          {p.sessions.length > 1 ? (
            <Sparkline c={c} values={p.sessions.map((s) => s.topWeight)} />
          ) : null}
        </View>
      ))}
    </View>
  )
}

function Stat({ c, value, label }: { c: Palette; value: string; label: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: c.paper, borderColor: c.line }]}>
      <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 18 }}>{value}</Text>
      <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 9.5, marginTop: 3 }}>
        {label}
      </Text>
    </View>
  )
}

function Sparkline({ c, values }: { c: Palette; values: number[] }) {
  const w = 260
  const h = 48
  const pad = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0
  const pts = values
    .map((v, i) => {
      const x = pad + i * step
      const y = pad + (h - pad * 2) * (1 - (v - min) / span)
      return `${x},${y}`
    })
    .join(' ')
  const last = values[values.length - 1]
  const lx = pad + (values.length - 1) * step
  const ly = pad + (h - pad * 2) * (1 - (last - min) / span)
  return (
    <View style={{ marginTop: 14 }}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polyline
          points={pts}
          fill="none"
          stroke={c.accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={lx} cy={ly} r={3.5} fill={c.accent} />
      </Svg>
    </View>
  )
}

function Empty({ c, title, body }: { c: Palette; title: string; body: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 44, paddingHorizontal: 20 }}>
      <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 17, marginBottom: 4 }}>
        {title}
      </Text>
      <Text
        style={{ color: c.muted, fontFamily: font.regular, fontSize: 13.5, textAlign: 'center' }}
      >
        {body}
      </Text>
    </View>
  )
}

type ExerciseProgress = {
  name: string
  topWeight: number
  best1rm: number
  totalVolume: number
  sessions: { date: string; topWeight: number }[]
}

function buildProgress(workouts: Workout[]): ExerciseProgress[] {
  const map = new Map<string, ExerciseProgress>()
  const chrono = [...workouts].sort((a, b) => a.date.localeCompare(b.date))
  for (const w of chrono) {
    const perExercise = new Map<string, { topWeight: number; best1rm: number; volume: number }>()
    for (const s of w.sets) {
      const key = s.exerciseName || s.exercise
      const cur = perExercise.get(key) ?? { topWeight: 0, best1rm: 0, volume: 0 }
      cur.topWeight = Math.max(cur.topWeight, s.weight)
      cur.best1rm = Math.max(cur.best1rm, s.weight * (1 + s.reps / 30))
      cur.volume += s.weight * s.reps
      perExercise.set(key, cur)
    }
    for (const [name, agg] of perExercise) {
      const p = map.get(name) ?? { name, topWeight: 0, best1rm: 0, totalVolume: 0, sessions: [] }
      p.topWeight = Math.max(p.topWeight, agg.topWeight)
      p.best1rm = Math.max(p.best1rm, agg.best1rm)
      p.totalVolume += agg.volume
      p.sessions.push({ date: w.date, topWeight: agg.topWeight })
      map.set(name, p)
    }
  }
  return [...map.values()].sort((a, b) =>
    (b.sessions[b.sessions.length - 1]?.date ?? '').localeCompare(
      a.sessions[a.sessions.length - 1]?.date ?? '',
    ),
  )
}

function groupByExercise(workout: Workout) {
  const map = new Map<string, { exercise: string; name: string; sets: Workout['sets'] }>()
  for (const s of workout.sets) {
    const g = map.get(s.exercise) ?? { exercise: s.exercise, name: s.exerciseName, sets: [] }
    g.sets.push(s)
    map.set(s.exercise, g)
  }
  return [...map.values()]
}

function trim(n: number): string {
  return n % 1 ? n.toFixed(1) : String(n)
}

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}t`
  return `${Math.round(n)} kg`
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  newPlan: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 14,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  pill: { borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 11 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
})
