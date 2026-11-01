import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { longDate, todayISO } from '../format'
import { CalendarPicker } from '../calendar'
import { EditItemSheet } from '../edit-sheet'
import { KindSelector, formatSet } from '../exercise-kind'
import {
  ExerciseInUseError,
  addExercise,
  deleteExercise,
  fetchExercises,
  updateExercise,
} from '../store'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Exercise, ExerciseKind, TrainingPlan, Workout } from '../types'

type SetEntry = { weight: number; reps: number; duration: number }

type Item = {
  exerciseId: string
  exerciseName: string
  exerciseKind: ExerciseKind
  sets: SetEntry[]
  w: string
  r: string
  m: string
}

export type SavePayload = {
  date: string
  note: string
  planId: string | null
  items: { exerciseId: string; sets: SetEntry[] }[]
}

function itemsFromWorkout(w: Workout): Item[] {
  const map = new Map<string, Item>()
  for (const s of w.sets) {
    const it = map.get(s.exercise) ?? {
      exerciseId: s.exercise,
      exerciseName: s.exerciseName,
      exerciseKind: s.exerciseKind,
      sets: [],
      w: '',
      r: '',
      m: '',
    }
    it.sets.push({ weight: s.weight, reps: s.reps, duration: s.duration })
    map.set(s.exercise, it)
  }
  return [...map.values()]
}

export default function LogWorkoutScreen({
  c,
  bottomInset,
  plans,
  workout,
  onClose,
  onSave,
}: {
  c: Palette
  bottomInset: number
  plans: TrainingPlan[]
  workout?: Workout | null
  onClose: () => void
  onSave: (payload: SavePayload) => Promise<void>
}) {
  const editing = !!workout
  const [date, setDate] = useState(workout?.date ?? todayISO())
  const [note, setNote] = useState(workout?.note ?? '')
  const [showPicker, setShowPicker] = useState(false)
  const [planId, setPlanId] = useState<string | null>(workout?.planId ?? null)
  const [items, setItems] = useState<Item[]>(() => (workout ? itemsFromWorkout(workout) : []))
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingEx, setEditingEx] = useState<Exercise | null>(null)

  const saveEditExercise = async (name: string, muscle: string, kind: ExerciseKind) => {
    if (!editingEx) return
    const updated = await updateExercise(editingEx.id, name, muscle, kind)
    setExercises((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    setItems((prev) =>
      prev.map((it) =>
        it.exerciseId === updated.id
          ? { ...it, exerciseName: updated.name, exerciseKind: updated.kind }
          : it,
      ),
    )
    setEditingEx(null)
  }

  const deleteEditExercise = async () => {
    if (!editingEx) return
    const removedId = editingEx.id
    try {
      await deleteExercise(removedId)
    } catch (e) {
      if (e instanceof ExerciseInUseError) {
        Alert.alert('Can’t delete', 'This exercise is used in a logged workout.')
        return
      }
      throw e
    }
    setExercises((prev) => prev.filter((e) => e.id !== removedId))
    setItems((prev) => prev.filter((it) => it.exerciseId !== removedId))
    setEditingEx(null)
  }

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
        exerciseKind: ex.kind,
        sets: [],
        w: '',
        r: '',
        m: '',
      })),
    )
  }

  const totalSets = items.reduce((n, it) => n + it.sets.length, 0)

  const addExerciseItem = (ex: Exercise) => {
    setPickerOpen(false)
    setItems((prev) =>
      prev.some((p) => p.exerciseId === ex.id)
        ? prev
        : [
            ...prev,
            {
              exerciseId: ex.id,
              exerciseName: ex.name,
              exerciseKind: ex.kind,
              sets: [],
              w: '',
              r: '',
              m: '',
            },
          ],
    )
  }

  const patchItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const addSetToItem = (idx: number) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const reps = parseInt(it.r, 10)
        const weight = parseFloat(it.w.replace(',', '.'))
        const minutes = parseFloat(it.m.replace(',', '.'))
        if (it.exerciseKind === 'time') {
          if (!(minutes > 0)) return it
          return {
            ...it,
            sets: [...it.sets, { weight: 0, reps: 0, duration: Math.round(minutes * 60) }],
          }
        }
        if (!(reps > 0)) return it
        if (it.exerciseKind === 'reps') {
          return { ...it, sets: [...it.sets, { weight: 0, reps, duration: 0 }] }
        }
        if (it.exerciseKind === 'bodyweight') {
          return {
            ...it,
            sets: [...it.sets, { weight: Number.isNaN(weight) ? 0 : weight, reps, duration: 0 }],
          }
        }
        if (Number.isNaN(weight)) return it
        return { ...it, sets: [...it.sets, { weight, reps, duration: 0 }] }
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
          {editing ? 'Edit workout' : 'Log workout'}
        </Text>
        <Pressable onPress={onClose} style={[styles.x, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.muted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      </View>

      {!editing && plans.length > 0 && (
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
      <CalendarPicker
        c={c}
        bottomInset={bottomInset}
        visible={showPicker}
        value={date}
        maxISO={todayISO()}
        title="Pick a date"
        onClose={() => setShowPicker(false)}
        onSelect={setDate}
      />

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
                {formatSet(s, it.exerciseKind)}
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
            {it.exerciseKind === 'weight' && (
              <>
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
              </>
            )}
            {it.exerciseKind === 'bodyweight' && (
              <>
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
                <Text style={{ color: c.muted, fontFamily: font.semi }}>+</Text>
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
              </>
            )}
            {it.exerciseKind === 'reps' && (
              <TextInput
                value={it.r}
                onChangeText={(t) => patchItem(idx, { r: t })}
                keyboardType="number-pad"
                placeholder="reps"
                placeholderTextColor={c.muted}
                style={[
                  styles.wideInput,
                  { color: c.ink, backgroundColor: c.paper, borderColor: c.line },
                ]}
              />
            )}
            {it.exerciseKind === 'time' && (
              <TextInput
                value={it.m}
                onChangeText={(t) => patchItem(idx, { m: t })}
                keyboardType="decimal-pad"
                placeholder="minutes"
                placeholderTextColor={c.muted}
                style={[
                  styles.wideInput,
                  { color: c.ink, backgroundColor: c.paper, borderColor: c.line },
                ]}
              />
            )}
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
            {editing ? 'Update' : 'Save'} workout
            {totalSets > 0 ? ` · ${totalSets} ${totalSets === 1 ? 'set' : 'sets'}` : ''}
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
        onLongPress={setEditingEx}
        onCreate={async (name, muscle, kind) => {
          const ex = await addExercise(name, muscle, kind)
          setExercises((prev) => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)))
          addExerciseItem(ex)
        }}
      />

      <EditItemSheet
        c={c}
        bottomInset={bottomInset}
        visible={!!editingEx}
        title="Edit exercise"
        nameLabel="Name"
        namePlaceholder="Exercise name"
        extraLabel="Muscle group (optional)"
        extraPlaceholder="e.g. Chest"
        name0={editingEx?.name ?? ''}
        extra0={editingEx?.muscle ?? ''}
        kindLabel="How it's measured"
        kind0={editingEx?.kind}
        deleteLabel="Delete exercise"
        onClose={() => setEditingEx(null)}
        onSave={saveEditExercise}
        onDelete={deleteEditExercise}
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
  onLongPress,
  onCreate,
}: {
  visible: boolean
  c: Palette
  bottomInset: number
  exercises: Exercise[]
  onClose: () => void
  onPick: (ex: Exercise) => void
  onLongPress: (ex: Exercise) => void
  onCreate: (name: string, muscle: string, kind: ExerciseKind) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('')
  const [kind, setKind] = useState<ExerciseKind>('weight')
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
            <KindSelector c={c} value={kind} onChange={setKind} />
            <Pressable
              onPress={async () => {
                await onCreate(query.trim(), muscle.trim(), kind)
                setQuery('')
                setMuscle('')
                setKind('weight')
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
              onLongPress={() => onLongPress(ex)}
              style={({ pressed }) => [
                styles.exRow,
                {
                  borderBottomColor: c.line,
                  backgroundColor: pressed ? c.accentSoft : 'transparent',
                },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>{ex.name}</Text>
                {ex.muscle ? (
                  <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5 }}>
                    {ex.muscle}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 11 }}>
                hold to edit
              </Text>
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
  wideInput: {
    width: 120,
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
