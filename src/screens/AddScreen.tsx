import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CURRENCY_SYMBOL, hoursLabel, longDate, money, todayISO } from '../format'
import { CalendarPicker } from '../calendar'
import { EditItemSheet } from '../edit-sheet'
import {
  addActivityType,
  deleteActivityType,
  fetchActivityTypes,
  updateActivityType,
} from '../store'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { ActivityType, NewSession, Profile } from '../types'

export default function AddScreen({
  c,
  profile,
  onClose,
  onSave,
}: {
  c: Palette
  profile: Profile
  onClose: () => void
  onSave: (s: NewSession) => void
}) {
  const [types, setTypes] = useState<ActivityType[]>([])
  const [picked, setPicked] = useState<ActivityType | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [editing, setEditing] = useState<ActivityType | null>(null)
  const [date, setDate] = useState(todayISO())
  const [showPicker, setShowPicker] = useState(false)
  const [hours, setHours] = useState('1.0')
  const [rate, setRate] = useState(String(profile.defaultRate))

  useEffect(() => {
    fetchActivityTypes()
      .then((list) => {
        setTypes(list)
        setPicked((p) => p ?? list[0] ?? null)
      })
      .catch(() => {})
  }, [])

  const currency = profile.currency
  const symbol = CURRENCY_SYMBOL[currency] ?? ''
  const h = parseFloat(hours.replace(',', '.')) || 0
  const r = parseFloat(rate.replace(',', '.')) || 0
  const previewCost = useMemo(() => money(h * r, currency), [h, r, currency])

  const bump = (delta: number) => {
    const next = Math.max(0.5, Math.round((h + delta) * 10) / 10)
    setHours(next.toFixed(1))
  }

  const createType = async () => {
    const name = newName.trim()
    if (!name) return
    const t = await addActivityType(name, newIcon.trim())
    setTypes((prev) => [...prev, t].sort((a, b) => a.name.localeCompare(b.name)))
    setPicked(t)
    setNewName('')
    setNewIcon('')
    setAdding(false)
  }

  const saveEdit = async (name: string, icon: string) => {
    if (!editing) return
    const updated = await updateActivityType(editing.id, name, icon)
    setTypes((prev) =>
      prev
        .map((t) => (t.id === updated.id ? updated : t))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    setPicked((p) => (p?.id === updated.id ? updated : p))
    setEditing(null)
  }

  const deleteEdit = async () => {
    if (!editing) return
    const removedId = editing.id
    await deleteActivityType(removedId)
    setTypes((prev) => {
      const next = prev.filter((t) => t.id !== removedId)
      setPicked((p) => (p?.id === removedId ? (next[0] ?? null) : p))
      return next
    })
    setEditing(null)
  }

  const save = () => {
    if (h <= 0 || !picked) return
    onSave({ activity: picked.name, icon: picked.icon, date, hours: h, rate: r })
  }

  return (
    <View>
      <View style={styles.head}>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 22 }}>
          Log a session
        </Text>
        <Pressable onPress={onClose} style={[styles.x, { backgroundColor: c.accentSoft }]}>
          <Text style={{ color: c.muted, fontSize: 18, lineHeight: 20 }}>×</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={[c.accent, c.accentInk]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.preview}
      >
        <Text style={{ color: c.onAccent, fontFamily: font.semi, fontSize: 12, opacity: 0.9 }}>
          This session costs
        </Text>
        <Text
          style={{ color: c.onAccent, fontFamily: font.displayMedium, fontSize: 40, marginTop: 4 }}
        >
          {previewCost}
        </Text>
        <Text
          style={{
            color: c.onAccent,
            fontFamily: font.regular,
            fontSize: 12.5,
            opacity: 0.9,
            marginTop: 6,
          }}
        >
          {hoursLabel(h)}h × {money(r, currency, true)} / h
        </Text>
      </LinearGradient>

      <Label c={c}>What are you training?</Label>
      <View style={styles.chips}>
        {types.map((t) => {
          const on = t.id === picked?.id
          return (
            <Pressable
              key={t.id}
              onPress={() => setPicked(t)}
              onLongPress={() => setEditing(t)}
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
                {t.icon ? `${t.icon} ` : ''}
                {t.name}
              </Text>
            </Pressable>
          )
        })}
        <Pressable
          onPress={() => setAdding((v) => !v)}
          style={[styles.chip, { borderColor: c.lineStrong, borderStyle: 'dashed' }]}
        >
          <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 13 }}>
            {adding ? '× Cancel' : '+ New type'}
          </Text>
        </Pressable>
      </View>

      {types.length > 0 && (
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 11.5, marginTop: 8 }}>
          Long-press a type to edit or delete it.
        </Text>
      )}

      {adding && (
        <View style={styles.addRow}>
          <TextInput
            value={newIcon}
            onChangeText={setNewIcon}
            placeholder="🙂"
            placeholderTextColor={c.muted}
            style={[
              styles.iconInput,
              { color: c.ink, backgroundColor: c.card, borderColor: c.line },
            ]}
          />
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New training type"
            placeholderTextColor={c.muted}
            autoCapitalize="words"
            onSubmitEditing={createType}
            style={[
              styles.nameInput,
              { color: c.ink, backgroundColor: c.card, borderColor: c.line },
            ]}
          />
          <Pressable onPress={createType} style={[styles.addBtn, { backgroundColor: c.accent }]}>
            <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 13 }}>Add</Text>
          </Pressable>
        </View>
      )}

      <Label c={c}>Date</Label>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.dateBtn, { backgroundColor: c.card, borderColor: c.line }]}
      >
        <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>
          {longDate(date, currency)}
        </Text>
      </Pressable>
      <CalendarPicker
        c={c}
        bottomInset={0}
        visible={showPicker}
        value={date}
        maxISO={todayISO()}
        title="Pick a date"
        onClose={() => setShowPicker(false)}
        onSelect={setDate}
      />

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Label c={c}>Duration</Label>
          <View style={[styles.stepper, { borderColor: c.line }]}>
            <Pressable
              onPress={() => bump(-0.5)}
              style={[styles.stepBtn, { backgroundColor: c.card }]}
            >
              <Text style={{ color: c.accentInk, fontSize: 22 }}>–</Text>
            </Pressable>
            <TextInput
              value={hours}
              onChangeText={setHours}
              keyboardType="decimal-pad"
              style={[styles.stepInput, { color: c.ink, backgroundColor: c.card }]}
            />
            <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 13, paddingRight: 8 }}>
              h
            </Text>
            <Pressable
              onPress={() => bump(0.5)}
              style={[styles.stepBtn, { backgroundColor: c.card }]}
            >
              <Text style={{ color: c.accentInk, fontSize: 22 }}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Label c={c}>Rate / hour</Label>
          <View style={[styles.stepper, { borderColor: c.line, backgroundColor: c.card }]}>
            <TextInput
              value={rate}
              onChangeText={setRate}
              keyboardType="decimal-pad"
              style={[styles.rateInput, { color: c.ink }]}
            />
            <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 13, paddingRight: 14 }}>
              {symbol} / h
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={save}
        disabled={!picked}
        style={({ pressed }) => [
          styles.save,
          { backgroundColor: c.accent, opacity: !picked ? 0.4 : pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>Save session</Text>
      </Pressable>

      <EditItemSheet
        c={c}
        bottomInset={0}
        visible={!!editing}
        title="Edit training type"
        nameLabel="Name"
        namePlaceholder="Training type"
        extraLabel="Emoji (optional)"
        extraPlaceholder="🙂"
        name0={editing?.name ?? ''}
        extra0={editing?.icon ?? ''}
        deleteLabel="Delete type"
        onClose={() => setEditing(null)}
        onSave={saveEdit}
        onDelete={deleteEdit}
      />
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
  preview: { borderRadius: radius.xl, padding: 22, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  iconInput: {
    width: 52,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: 11,
    fontSize: 17,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontFamily: font.semi,
    fontSize: 15,
  },
  addBtn: { borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 16 },
  dateBtn: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  row2: { flexDirection: 'row', gap: 12 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stepBtn: { width: 46, height: 50, alignItems: 'center', justifyContent: 'center' },
  stepInput: { flex: 1, textAlign: 'center', fontFamily: font.bold, fontSize: 17, height: 50 },
  rateInput: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    height: 50,
    paddingHorizontal: 15,
  },
  save: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
})
