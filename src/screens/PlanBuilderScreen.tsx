import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { EditItemSheet } from '../edit-sheet'
import {
  ExerciseInUseError,
  addExercise,
  deleteExercise,
  fetchExercises,
  updateExercise,
} from '../store'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Exercise, TrainingPlan } from '../types'

const sectionLabel = (c: Palette) => ({
  color: c.muted,
  fontFamily: font.semi,
  fontSize: 12,
  marginTop: 20,
  marginBottom: 8,
})

export default function PlanBuilderScreen({
  c,
  plan,
  onClose,
  onSave,
}: {
  c: Palette
  plan?: TrainingPlan | null
  onClose: () => void
  onSave: (name: string, note: string, exerciseIds: string[]) => Promise<void>
}) {
  const [name, setName] = useState(plan?.name ?? '')
  const [note, setNote] = useState(plan?.note ?? '')
  const [exercises, setExercises] = useState<Exercise[]>(plan?.exercises ?? [])
  const [selected, setSelected] = useState<string[]>(plan ? plan.exercises.map((e) => e.id) : [])
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingEx, setEditingEx] = useState<Exercise | null>(null)

  useEffect(() => {
    fetchExercises()
      .then(setExercises)
      .catch(() => {})
  }, [])

  const saveEditExercise = async (nm: string, ms: string) => {
    if (!editingEx) return
    const updated = await updateExercise(editingEx.id, nm, ms)
    setExercises((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => a.name.localeCompare(b.name)),
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
    setSelected((prev) => prev.filter((x) => x !== removedId))
    setEditingEx(null)
  }

  const filtered = useMemo(
    () => exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())),
    [exercises, query],
  )
  const canCreate =
    query.trim().length > 0 &&
    !exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase())

  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const create = async () => {
    const n = query.trim()
    if (!n) return
    const ex = await addExercise(n, muscle.trim())
    setExercises((prev) => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)))
    setSelected((prev) => [...prev, ex.id])
    setQuery('')
    setMuscle('')
  }

  const save = async () => {
    if (!name.trim() || selected.length === 0) return
    setBusy(true)
    try {
      await onSave(name.trim(), note.trim(), selected)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View>
      <View style={styles.head}>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 22 }}>
          {plan ? 'Edit training plan' : 'New training plan'}
        </Text>
        <Pressable onPress={onClose} style={[styles.x, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.muted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Plan name (e.g. Push day)"
        placeholderTextColor={c.muted}
        autoCapitalize="words"
        style={[styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional)"
        placeholderTextColor={c.muted}
        style={[
          styles.input,
          { color: c.ink, backgroundColor: c.card, borderColor: c.line, marginTop: 10 },
        ]}
      />

      <Text style={sectionLabel(c)}>
        In this plan{selected.length > 0 ? ` · ${selected.length}` : ''}
      </Text>
      {selected.length === 0 ? (
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13 }}>
          Pick exercises from your library below, or create new ones.
        </Text>
      ) : (
        <View style={styles.selChips}>
          {selected.map((id, i) => {
            const ex = byId.get(id)
            if (!ex) return null
            return (
              <Pressable
                key={id}
                onPress={() => toggle(id)}
                style={[styles.selChip, { backgroundColor: c.accentSoft }]}
              >
                <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 13 }}>
                  {i + 1}. {ex.name} ×
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <Text style={sectionLabel(c)}>Your exercises</Text>
      <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 11.5, marginBottom: 8 }}>
        Tap to add to the plan · long-press to edit or delete.
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search or type a new name"
        placeholderTextColor={c.muted}
        autoCapitalize="words"
        style={[styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
      />
      {canCreate && (
        <View style={{ marginTop: 10, gap: 8 }}>
          <TextInput
            value={muscle}
            onChangeText={setMuscle}
            placeholder="Muscle group (optional)"
            placeholderTextColor={c.muted}
            autoCapitalize="words"
            style={[styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
          />
          <Pressable onPress={create} style={[styles.createBtn, { backgroundColor: c.accent }]}>
            <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 14 }}>
              Create “{query.trim()}”
            </Text>
          </Pressable>
        </View>
      )}

      <View style={{ marginTop: 12 }}>
        {filtered.map((ex) => {
          const on = selected.includes(ex.id)
          return (
            <Pressable
              key={ex.id}
              onPress={() => toggle(ex.id)}
              onLongPress={() => setEditingEx(ex)}
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
              <View
                style={[
                  styles.check,
                  {
                    borderColor: on ? c.accent : c.lineStrong,
                    backgroundColor: on ? c.accent : 'transparent',
                  },
                ]}
              >
                {on ? (
                  <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 13 }}>✓</Text>
                ) : null}
              </View>
            </Pressable>
          )
        })}
      </View>

      <Pressable
        onPress={save}
        disabled={busy || !name.trim() || selected.length === 0}
        style={({ pressed }) => [
          styles.save,
          {
            backgroundColor: c.accent,
            opacity: !name.trim() || selected.length === 0 ? 0.4 : pressed || busy ? 0.9 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>Save plan</Text>
        )}
      </Pressable>

      <EditItemSheet
        c={c}
        bottomInset={0}
        visible={!!editingEx}
        title="Edit exercise"
        nameLabel="Name"
        namePlaceholder="Exercise name"
        extraLabel="Muscle group (optional)"
        extraPlaceholder="e.g. Chest"
        name0={editingEx?.name ?? ''}
        extra0={editingEx?.muscle ?? ''}
        deleteLabel="Delete exercise"
        onClose={() => setEditingEx(null)}
        onSave={saveEditExercise}
        onDelete={deleteEditExercise}
      />
    </View>
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
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: font.regular,
    fontSize: 15,
  },
  selChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selChip: { borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 13 },
  createBtn: { borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
})
