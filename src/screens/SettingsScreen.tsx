import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
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

  const commit = (patch: Partial<Profile>) => onChangeProfile({ ...profile, ...patch })

  return (
    <View>
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13 }}>Your</Text>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginTop: 1 }}>
          Settings
        </Text>
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
  group: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 16 },
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
