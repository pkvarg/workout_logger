import React, { useEffect, useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { DEMO_MODE } from '../store'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Profile } from '../types'

export type ThemePref = 'system' | 'light' | 'dark'

const CURRENCIES = [
  { code: 'EUR', label: '€' },
  { code: 'CZK', label: 'Kč' },
  { code: 'USD', label: '$' },
  { code: 'GBP', label: '£' },
]

export default function SettingsScreen({
  c,
  profile,
  themePref,
  onChangeProfile,
  onChangeTheme,
  onSignOut,
  onReset,
}: {
  c: Palette
  profile: Profile
  themePref: ThemePref
  onChangeProfile: (p: Profile) => void
  onChangeTheme: (t: ThemePref) => void
  onSignOut: () => void
  onReset: () => void
}) {
  const [name, setName] = useState(profile.name)
  const [rate, setRate] = useState(String(profile.defaultRate))
  const [goal, setGoal] = useState(String(profile.monthlyGoal))
  const [justSaved, setJustSaved] = useState(false)

  const commit = (patch: Partial<Profile>) => onChangeProfile({ ...profile, ...patch })

  const editedRate = parseFloat(rate.replace(',', '.')) || 0
  const editedGoal = parseFloat(goal.replace(',', '.')) || 20
  const dirty =
    name.trim() !== profile.name ||
    editedRate !== profile.defaultRate ||
    editedGoal !== profile.monthlyGoal

  const saveFields = () =>
    commit({ name: name.trim(), defaultRate: editedRate, monthlyGoal: editedGoal })

  useEffect(() => {
    if (dirty) setJustSaved(false)
  }, [dirty])

  const pending = useRef({ dirty, save: saveFields })
  pending.current = { dirty, save: saveFields }
  useEffect(() => {
    return () => {
      if (pending.current.dirty) pending.current.save()
    }
  }, [])

  return (
    <View>
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13 }}>Your</Text>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginTop: 1 }}>
          Settings
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 18 }}>
        <View style={[styles.bigAvatar, { backgroundColor: c.accent }]}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.bigAvatarImg} />
          ) : (
            <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 30 }}>
              {(profile.name || '?').trim().charAt(0).toUpperCase() || '?'}
            </Text>
          )}
        </View>
        {profile.name ? (
          <Text
            style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 18, marginTop: 10 }}
          >
            {profile.name}
          </Text>
        ) : null}
      </View>

      <Group c={c}>
        <Row c={c} label="Name" last={false}>
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={() => commit({ name: name.trim() })}
            style={[styles.value, { color: c.accentInk }]}
          />
        </Row>
        <Row c={c} label="Default rate" sub="Pre-fills every new session" last={false}>
          <TextInput
            value={rate}
            onChangeText={setRate}
            onEndEditing={() => commit({ defaultRate: parseFloat(rate.replace(',', '.')) || 0 })}
            keyboardType="decimal-pad"
            style={[styles.value, { color: c.accentInk }]}
          />
        </Row>
        <Row c={c} label="Monthly goal" sub="Hours for the progress ring" last={false}>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            onEndEditing={() => commit({ monthlyGoal: parseFloat(goal.replace(',', '.')) || 20 })}
            keyboardType="number-pad"
            style={[styles.value, { color: c.accentInk }]}
          />
        </Row>
        <Row c={c} label="Currency" last>
          <View style={styles.chipRow}>
            {CURRENCIES.map((cur) => {
              const on = cur.code === profile.currency
              return (
                <Pressable
                  key={cur.code}
                  onPress={() => commit({ currency: cur.code })}
                  style={[
                    styles.miniChip,
                    {
                      borderColor: on ? c.accent : c.line,
                      backgroundColor: on ? c.accentSoft : 'transparent',
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
                    {cur.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Row>
      </Group>

      <Pressable
        onPress={() => {
          saveFields()
          setJustSaved(true)
        }}
        disabled={!dirty}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: c.accent, opacity: !dirty ? 0.45 : pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>
          {!dirty && justSaved ? 'Saved ✓' : 'Save changes'}
        </Text>
      </Pressable>

      <Group c={c}>
        <Row c={c} label="Appearance" last>
          <View style={styles.chipRow}>
            {(['system', 'light', 'dark'] as ThemePref[]).map((t) => {
              const on = t === themePref
              return (
                <Pressable
                  key={t}
                  onPress={() => onChangeTheme(t)}
                  style={[
                    styles.miniChip,
                    {
                      borderColor: on ? c.accent : c.line,
                      backgroundColor: on ? c.accentSoft : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: on ? c.accentInk : c.muted,
                      fontFamily: font.semi,
                      fontSize: 12.5,
                    }}
                  >
                    {t === 'system' ? 'System' : t === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Row>
      </Group>

      <Group c={c}>
        {DEMO_MODE && (
          <Pressable
            onPress={onReset}
            style={[styles.actionRow, { borderBottomColor: c.line, borderBottomWidth: 1 }]}
          >
            <Text style={{ color: c.danger, fontFamily: font.medium, fontSize: 14 }}>
              Reset demo data
            </Text>
            <Text style={{ color: c.muted, fontSize: 15 }}>↺</Text>
          </Pressable>
        )}
        <Pressable onPress={onSignOut} style={styles.actionRow}>
          <Text style={{ color: c.danger, fontFamily: font.medium, fontSize: 14 }}>Sign out</Text>
          <Text style={{ color: c.muted, fontSize: 15 }}>→</Text>
        </Pressable>
      </Group>
    </View>
  )
}

function Group({ c, children }: { c: Palette; children: React.ReactNode }) {
  return (
    <View style={[styles.group, { backgroundColor: c.card, borderColor: c.line }]}>{children}</View>
  )
}

function Row({
  c,
  label,
  sub,
  last,
  children,
}: {
  c: Palette
  label: string
  sub?: string
  last: boolean
  children: React.ReactNode
}) {
  return (
    <View style={[styles.row, !last && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontFamily: font.medium, fontSize: 14 }}>{label}</Text>
        {sub && (
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 11.5, marginTop: 2 }}>
            {sub}
          </Text>
        )}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  bigAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bigAvatarImg: { width: 84, height: 84, borderRadius: 42 },
  group: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 16 },
  saveBtn: { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 17,
    gap: 12,
  },
  value: { fontFamily: font.semi, fontSize: 15, textAlign: 'right', minWidth: 90 },
  chipRow: { flexDirection: 'row', gap: 6 },
  miniChip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
})
