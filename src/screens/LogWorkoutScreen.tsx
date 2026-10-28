import DateTimePicker from '@react-native-community/datetimepicker'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { longDate, todayISO } from '../format'
import { addExercise, fetchExercises } from '../store'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Exercise, TrainingPlan } from '../types'

type Item = {
  exerciseId: string
  exerciseName: string
  sets: { weight: number; reps: number }[]
  w: string
  r: string
}

export type SavePayload = {
  date: string
  note: string
  planId: string | null
  items: { exerciseId: string; sets: { weight: number; reps: number }[] }[]
}

export default function LogWorkoutScreen({
  c,
  bottomInset,
  plans,
  onClose,
  onSave,
}: {
  c: Palette
  bottomInset: number
  plans: TrainingPlan[]
  onClose: () => void
  onSave: (payload: SavePayload) => Promise<void>
}) {
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [planId, setPlanId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchExercises()
      .then(setExercises)
      .catch(() => {})
  }, [])

  const selectPlan = (p: TrainingPlan) => {
    setPlanId(p.id)
    setItems(
      p.exercises.map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: [],
        w: '',
        r: '',
      })),
    )
  }

  const totalSets = items.reduce((n, it) => n + it.sets.length, 0)

  const addExerciseItem = (ex: Exercise) => {
    setPickerOpen(false)
    setItems((prev) =>
      prev.some((p) => p.exerciseId === ex.id)
        ? prev
        : [...prev, { exerciseId: ex.id, exerciseName: ex.name, sets: [], w: '', r: '' }],
    )
  }

  const patchItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const addSetToItem = (idx: number) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const weight = parseFloat(it.w.replace(',', '.'))
        const reps = parseInt(it.r, 10)
        if (!(reps > 0) || Number.isNaN(weight)) return it
        return { ...it, sets: [...it.sets, { weight, reps }] }
      }),
    )
  }

  const removeSet = (idx: number, setIdx: number) =>
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, sets: it.sets.filter((_, si) => si !== setIdx) } : it,
      ),
    )

  const save = async () => {
    if (totalSets === 0) return
    setBusy(true)
    try {
      await onSave({
        date,
        note: note.trim(),
        planId,
        items: items
          .filter((it) => it.sets.length > 0)
          .map((it) => ({ exerciseId: it.exerciseId, sets: it.sets })),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <View style={styles.head}>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 22 }}>
          Log workout
        </Text>
        <Pressable onPress={onClose} style={[styles.x, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.muted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      </View>

      {plans.length > 0 && (
        <View style={{ marginBottom: 6 }}>
          <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12, marginBottom: 8 }}>
            Training plan
          </Text>
          <View style={styles.planChips}>
            {plans.map((p) => {
              const on = p.id === planId
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectPlan(p)}
                  style={[
                    styles.planChip,
                    {
                      borderColor: on ? c.accent : c.line,
                      backgroundColor: on ? c.accentSoft : c.card,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: on ? c.accentInk : c.muted,
                      fontFamily: font.semi,
                      fontSize: 13,
                    }}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.dateBtn, { backgroundColor: c.card, borderColor: c.line }]}
      >
        <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12, marginBottom: 2 }}>
          Date
        </Text>
        <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>
          {longDate(date, 'EUR')}
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          maximumDate={new Date()}
          onChange={(_e, d) => {
            setShowPicker(Platform.OS === 'ios')
            if (d) setDate(d.toISOString().slice(0, 10))
          }}
        />
      )}

      {items.map((it, idx) => (
        <View
          key={it.exerciseId}
          style={[styles.exCard, { backgroundColor: c.card, borderColor: c.line }]}
        >
          <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15, marginBottom: 10 }}>
            {it.exerciseName}
          </Text>

          {it.sets.map((s, si) => (
            <Pressable key={si} onPress={() => removeSet(idx, si)} style={styles.loggedSet}>
              <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12.5, width: 26 }}>
                {si + 1}
              </Text>
              <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 14 }}>
                {s.weight} kg × {s.reps}
              </Text>
              <Text
                style={{
                  color: c.muted,
                  fontFamily: font.regular,
                  fontSize: 11.5,
                  marginLeft: 'auto',
                }}
              >
                tap to remove
              </Text>
            </Pressable>
          ))}

          <View style={styles.setInputs}>
            <TextInput
              value={it.w}
              onChangeText={(t) => patchItem(idx, { w: t })}
              keyboardType="decimal-pad"
              placeholder="kg"
              placeholderTextColor={c.muted}
              style={[
                styles.smallInput,
                { color: c.ink, backgroundColor: c.paper, borderColor: c.line },
              ]}
            />
            <Text style={{ color: c.muted, fontFamily: font.semi }}>×</Text>
            <TextInput
              value={it.r}
              onChangeText={(t) => patchItem(idx, { r: t })}
              keyboardType="number-pad"
              placeholder="reps"
              placeholderTextColor={c.muted}
              style={[
                styles.smallInput,
                { color: c.ink, backgroundColor: c.paper, borderColor: c.line },
              ]}
            />
            <Pressable
              onPress={() => addSetToItem(idx)}
              style={[styles.addSet, { backgroundColor: c.accentSoft }]}
            >
              <Text style={{ color: c.accentInk, fontFamily: font.bold, fontSize: 13 }}>
                Add set
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.addExercise, { borderColor: c.accent }]}
      >
        <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 14 }}>
          + Add exercise
        </Text>
      </Pressable>

      <View style={{ marginTop: 18 }}>
        <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12, marginBottom: 8 }}>
          Note (optional)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="How did it go?"
          placeholderTextColor={c.muted}
          style={[styles.note, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
        />
      </View>

      <Pressable
        onPress={save}
        disabled={busy || totalSets === 0}
        style={({ pressed }) => [
          styles.save,
          { backgroundColor: c.accent, opacity: totalSets === 0 ? 0.4 : pressed || busy ? 0.9 : 1 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>
            Save workout{totalSets > 0 ? ` · ${totalSets} ${totalSets === 1 ? 'set' : 'sets'}` : ''}
          </Text>
        )}
      </Pressable>

      <ExercisePicker
        visible={pickerOpen}
        c={c}
        bottomInset={bottomInset}
        exercises={exercises}
        onClose={() => setPickerOpen(false)}
        onPick={addExerciseItem}
        onCreate={async (name, muscle) => {
          const ex = await addExercise(name, muscle)
          setExercises((prev) => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)))
          addExerciseItem(ex)
        }}
      />
    </View>
  )
}

function ExercisePicker({
  visible,
  c,
  bottomInset,
  exercises,
  onClose,
  onPick,
  onCreate,
}: {
  visible: boolean
  c: Palette
  bottomInset: number
  exercises: Exercise[]
  onClose: () => void
  onPick: (ex: Exercise) => void
  onCreate: (name: string, muscle: string) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('')
  const filtered = useMemo(
    () => exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())),
    [exercises, query],
  )
  const canCreate =
    query.trim().length > 0 &&
    !filtered.some((e) => e.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.paper, paddingBottom: 24 + bottomInset }]}>
        <View style={[styles.grip, { backgroundColor: c.lineStrong }]} />
        <Text
          style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginBottom: 12 }}
        >
          Choose an exercise
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search or type a new name"
          placeholderTextColor={c.muted}
          autoCapitalize="words"
          style={[styles.note, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
        />
        {canCreate && (
          <View style={{ marginTop: 10, gap: 8 }}>
            <TextInput
              value={muscle}
              onChangeText={setMuscle}
              placeholder="Muscle group (optional)"
              placeholderTextColor={c.muted}
              autoCapitalize="words"
              style={[styles.note, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
            />
            <Pressable
              onPress={async () => {
                await onCreate(query.trim(), muscle.trim())
                setQuery('')
                setMuscle('')
              }}
              style={[styles.createBtn, { backgroundColor: c.accent }]}
            >
              <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 14 }}>
                Create “{query.trim()}”
              </Text>
            </Pressable>
          </View>
        )}
        <ScrollView style={{ maxHeight: 320, marginTop: 12 }} keyboardShouldPersistTaps="handled">
          {filtered.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={() => onPick(ex)}
              style={({ pressed }) => [
                styles.exRow,
                {
                  borderBottomColor: c.line,
                  backgroundColor: pressed ? c.accentSoft : 'transparent',
                },
              ]}
            >
              <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>{ex.name}</Text>
              {ex.muscle ? (
                <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5 }}>
                  {ex.muscle}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
  planChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planChip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  dateBtn: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 6,
  },
  exCard: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginTop: 14 },
  loggedSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  setInputs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  smallInput: {
    width: 70,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: font.semi,
    fontSize: 15,
    textAlign: 'center',
  },
  addSet: {
    marginLeft: 'auto',
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  addExercise: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  note: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontFamily: font.regular,
    fontSize: 15,
  },
  save: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
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
  createBtn: { borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
})
