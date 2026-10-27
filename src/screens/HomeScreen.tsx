import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ProgressRing, SessionRow, StatCard } from '../components'
import { cost, isInPreviousMonth, isSameMonth, money } from '../format'
import type { Palette } from '../theme'
import { font, radius } from '../theme'
import type { Profile, Session } from '../types'

type Period = 'month' | 'all'

export default function HomeScreen({
  c,
  profile,
  sessions,
  onOpenSession,
  onSeeAll,
}: {
  c: Palette
  profile: Profile
  sessions: Session[]
  onOpenSession: (s: Session) => void
  onSeeAll: () => void
}) {
  const [period, setPeriod] = useState<Period>('month')
  const currency = profile.currency

  const scope = useMemo(
    () => (period === 'month' ? sessions.filter((s) => isSameMonth(s.date)) : sessions),
    [period, sessions],
  )
  const total = scope.reduce((a, s) => a + cost(s), 0)
  const monthHours = useMemo(
    () => sessions.filter((s) => isSameMonth(s.date)).reduce((a, s) => a + s.hours, 0),
    [sessions],
  )
  const prevTotal = useMemo(
    () => sessions.filter((s) => isInPreviousMonth(s.date)).reduce((a, s) => a + cost(s), 0),
    [sessions],
  )

  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const greeting = greet()

  return (
    <View>
      <View style={styles.top}>
        <View>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 13 }}>
            {greeting},
          </Text>
          <Text
            style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginTop: 1 }}
          >
            {profile.name || 'there'}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: c.accent }]}>
          <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>
            {(profile.name || '?').trim().charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      </View>

      <View style={[styles.seg, { backgroundColor: c.card, borderColor: c.line }]}>
        {(['month', 'all'] as Period[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.segBtn, period === p && { backgroundColor: c.accentSoft }]}
          >
            <Text
              style={{
                color: period === p ? c.accentInk : c.muted,
                fontFamily: font.semi,
                fontSize: 12.5,
              }}
            >
              {p === 'month' ? 'This month' : 'All time'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.line }]}>
        <ProgressRing hours={round(monthHours)} goal={profile.monthlyGoal} c={c} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12 }}>
            {period === 'month' ? 'Spent this month' : 'Spent all time'}
          </Text>
          <Text
            style={{
              color: c.ink,
              fontFamily: font.displayMedium,
              fontSize: 42,
              marginVertical: 5,
            }}
          >
            {money(total, currency)}
          </Text>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 12.5 }}>
            {delta(period, total, prevTotal, c)}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard value={String(scope.length)} label="Sessions" c={c} />
        <StatCard
          value={money(scope.length ? total / scope.length : 0, currency)}
          label="Avg / session"
          c={c}
        />
      </View>

      <View style={styles.sectionHead}>
        <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 17 }}>Recent</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={{ color: c.accentInk, fontFamily: font.semi, fontSize: 12.5 }}>See all</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <Empty
          c={c}
          title="Nothing logged yet"
          body="Tap the + button to add your first training session."
        />
      ) : (
        recent.map((s) => (
          <SessionRow key={s.id} session={s} currency={currency} c={c} onPress={onOpenSession} />
        ))
      )}
    </View>
  )
}

function delta(period: Period, total: number, prevTotal: number, c: Palette) {
  if (period !== 'month') return 'All sessions tracked'
  if (prevTotal <= 0) return 'First month tracked'
  const diff = Math.round(((total - prevTotal) / prevTotal) * 100)
  const up = diff >= 0
  return `${up ? '▲' : '▼'} ${Math.abs(diff)}% vs last month`
}

function Empty({ c, title, body }: { c: Palette; title: string; body: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
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

const round = (n: number) => Math.round(n * 10) / 10

function greet(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seg: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 3,
    gap: 2,
    marginTop: 2,
    marginBottom: 18,
  },
  segBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 22,
  },
  stats: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 6 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
})
