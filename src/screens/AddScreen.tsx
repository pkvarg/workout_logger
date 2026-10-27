import DateTimePicker from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CURRENCY_SYMBOL, hoursLabel, longDate, money, todayISO } from '../format'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { NewSession, Profile } from '../types'

const ACTIVITIES = [
  { act: 'Reformer Pilates', icon: '🤸' },
  { act: 'Personal training', icon: '🏋️' },
  { act: 'Ballet', icon: '🩰' },
  { act: 'Swimming', icon: '🏊' },
  { act: 'Yoga', icon: '🧘' },
]

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
  const [picked, setPicked] = useState(ACTIVITIES[0])
  const [date, setDate] = useState(todayISO())
  const [showPicker, setShowPicker] = useState(false)
  const [hours, setHours] = useState('1.0')
  const [rate, setRate] = useState(String(profile.defaultRate))

  const currency = profile.currency
  const symbol = CURRENCY_SYMBOL[currency] ?? ''
  const h = parseFloat(hours.replace(',', '.')) || 0
  const r = parseFloat(rate.replace(',', '.')) || 0
  const previewCost = useMemo(() => money(h * r, currency), [h, r, currency])

  const bump = (delta: number) => {
    const next = Math.max(0.5, Math.round((h + delta) * 10) / 10)
    setHours(next.toFixed(1))
  }

  const save = () => {
    if (h <= 0) return
    onSave({ activity: picked.act, icon: picked.icon, date, hours: h, rate: r })
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
        {ACTIVITIES.map((a) => {
          const on = a.act === picked.act
          return (
            <Pressable
              key={a.act}
              onPress={() => setPicked(a)}
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
                {a.icon} {a.act}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Label c={c}>Date</Label>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.dateBtn, { backgroundColor: c.card, borderColor: c.line }]}
      >
        <Text style={{ color: c.ink, fontFamily: font.semi, fontSize: 15 }}>
          {longDate(date, currency)}
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          maximumDate={new Date()}
          onChange={(_e, selected) => {
            setShowPicker(Platform.OS === 'ios')
            if (selected) setDate(selected.toISOString().slice(0, 10))
          }}
        />
      )}

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
        style={({ pressed }) => [
          styles.save,
          { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>Save session</Text>
      </Pressable>
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
