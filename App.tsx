import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree'
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces'
import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { cost, longDate, money } from './src/format'
import AddScreen from './src/screens/AddScreen'
import ExportScreen from './src/screens/ExportScreen'
import HomeScreen from './src/screens/HomeScreen'
import SettingsScreen, { type ThemePref } from './src/screens/SettingsScreen'
import SessionsScreen from './src/screens/SessionsScreen'
import LoginScreen from './src/screens/LoginScreen'
import {
  addSession,
  deleteSession,
  fetchProfile,
  fetchSessions,
  hasSession,
  resetDemoData,
  saveProfile,
  signOut,
} from './src/store'
import { dark, font, light, radius, type Palette } from './src/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'react-native'
import type { NewSession, Profile, Session } from './src/types'

type Tab = 'home' | 'sessions' | 'settings'
const THEME_KEY = 'sl.theme'

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  )
}

function Root() {
  const insets = useSafeAreaInsets()
  const scheme = useColorScheme()

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  })

  const [themePref, setThemePref] = useState<ThemePref>('dark')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [tab, setTab] = useState<Tab>('home')
  const [addOpen, setAddOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [detail, setDetail] = useState<Session | null>(null)

  const isDark = themePref === 'dark' || (themePref === 'system' && scheme === 'dark')
  const c = isDark ? dark : light

  useEffect(() => {
    ;(async () => {
      try {
        const stored = (await AsyncStorage.getItem(THEME_KEY)) as ThemePref | null
        if (stored) setThemePref(stored)
      } catch {}
      setSignedIn(await hasSession())
    })()
  }, [])

  const reload = useCallback(async () => {
    const [p, s] = await Promise.all([fetchProfile(), fetchSessions()])
    setProfile(p)
    setSessions(s)
  }, [])

  useEffect(() => {
    if (signedIn) reload()
  }, [signedIn, reload])

  const changeTheme = async (t: ThemePref) => {
    setThemePref(t)
    try {
      await AsyncStorage.setItem(THEME_KEY, t)
    } catch {}
  }

  const { toast, showToast } = useToast(c, insets.bottom)

  if (!fontsLoaded || signedIn === null) {
    return <Splash c={c} />
  }

  if (!signedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <LoginScreen c={c} onDone={() => setSignedIn(true)} />
        </View>
      </View>
    )
  }

  if (!profile) return <Splash c={c} />

  const onSave = async (s: NewSession) => {
    await addSession(s)
    await reload()
    setAddOpen(false)
    setTab('home')
    showToast('Session saved')
  }

  const onDelete = async (id: string) => {
    await deleteSession(id)
    await reload()
    setDetail(null)
    showToast('Session removed')
  }

  const onProfile = async (p: Profile) => {
    setProfile(p)
    try {
      await saveProfile(p)
    } catch {}
  }

  const onResetDemo = async () => {
    await resetDemoData()
    await reload()
    setTab('home')
    showToast('Demo data reset')
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 22,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'home' && (
          <HomeScreen
            c={c}
            profile={profile}
            sessions={sessions}
            onOpenSession={setDetail}
            onSeeAll={() => setTab('sessions')}
          />
        )}
        {tab === 'sessions' && (
          <SessionsScreen
            c={c}
            sessions={sessions}
            currency={profile.currency}
            onOpenSession={setDetail}
            onExport={() => setExportOpen(true)}
          />
        )}
        {tab === 'settings' && (
          <SettingsScreen
            c={c}
            profile={profile}
            themePref={themePref}
            onChangeProfile={onProfile}
            onChangeTheme={changeTheme}
            onSignOut={async () => {
              await signOut()
              setSignedIn(false)
              setTab('home')
            }}
            onReset={onResetDemo}
          />
        )}
      </ScrollView>

      <Pressable
        onPress={() => setAddOpen(true)}
        style={[styles.fab, { backgroundColor: c.accent, bottom: 94 + insets.bottom }]}
      >
        <Text style={{ color: c.onAccent, fontSize: 30, fontWeight: '300', lineHeight: 34 }}>
          +
        </Text>
      </Pressable>

      <BottomNav c={c} tab={tab} onTab={setTab} bottomInset={insets.bottom} />

      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.paper }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + 4,
              paddingHorizontal: 22,
              paddingBottom: 40 + insets.bottom,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <AddScreen c={c} profile={profile} onClose={() => setAddOpen(false)} onSave={onSave} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={exportOpen} animationType="slide" onRequestClose={() => setExportOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.paper }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + 4,
              paddingHorizontal: 22,
              paddingBottom: 40 + insets.bottom,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <ExportScreen
              c={c}
              profile={profile}
              sessions={sessions}
              onClose={() => setExportOpen(false)}
            />
          </ScrollView>
        </View>
      </Modal>

      <DetailSheet
        c={c}
        session={detail}
        currency={profile.currency}
        onClose={() => setDetail(null)}
        onDelete={onDelete}
        bottomInset={insets.bottom}
      />

      {toast}
    </View>
  )
}

function BottomNav({
  c,
  tab,
  onTab,
  bottomInset,
}: {
  c: Palette
  tab: Tab
  onTab: (t: Tab) => void
  bottomInset: number
}) {
  const items: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'sessions', label: 'Ledger' },
    { key: 'settings', label: 'Settings' },
  ]
  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: c.card, borderTopColor: c.line, paddingBottom: bottomInset },
      ]}
    >
      {items.map((it) => {
        const on = tab === it.key
        return (
          <Pressable key={it.key} onPress={() => onTab(it.key)} style={styles.navBtn}>
            <Text
              style={{ color: on ? c.accentInk : c.muted, fontFamily: font.semi, fontSize: 11 }}
            >
              {it.label}
            </Text>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                marginTop: 5,
                backgroundColor: on ? c.accent : 'transparent',
              }}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

function DetailSheet({
  c,
  session,
  currency,
  onClose,
  onDelete,
  bottomInset,
}: {
  c: Palette
  session: Session | null
  currency: string
  onClose: () => void
  onDelete: (id: string) => void
  bottomInset: number
}) {
  return (
    <Modal visible={!!session} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      {session && (
        <View style={[styles.sheet, { backgroundColor: c.paper, paddingBottom: 28 + bottomInset }]}>
          <View style={[styles.grip, { backgroundColor: c.lineStrong }]} />
          <View style={[styles.sheetIco, { backgroundColor: c.accentSoft }]}>
            <Text style={{ fontSize: 26 }}>{session.icon ?? '•'}</Text>
          </View>
          <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 22 }}>
            {session.activity}
          </Text>
          <Text
            style={{
              color: c.muted,
              fontFamily: font.regular,
              fontSize: 13.5,
              marginTop: 2,
              marginBottom: 18,
            }}
          >
            {longDate(session.date, currency)}
          </Text>
          <View style={styles.dGrid}>
            <DCell
              c={c}
              value={`${session.hours % 1 ? session.hours.toFixed(1) : session.hours}h`}
              label="DURATION"
            />
            <DCell c={c} value={money(session.rate, currency)} label="RATE / H" />
            <DCell c={c} value={money(cost(session), currency)} label="COST" />
          </View>
          <Pressable
            onPress={() => onDelete(session.id)}
            style={[styles.ghost, { borderColor: c.lineStrong }]}
          >
            <Text style={{ color: c.danger, fontFamily: font.bold, fontSize: 14.5 }}>
              Remove session
            </Text>
          </Pressable>
        </View>
      )}
    </Modal>
  )
}

function DCell({ c, value, label }: { c: Palette; value: string; label: string }) {
  return (
    <View style={[styles.dCell, { backgroundColor: c.card, borderColor: c.line }]}>
      <Text style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 19 }}>{value}</Text>
      <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 10, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  )
}

function useToast(c: Palette, bottomInset: number) {
  const opacity = useRef(new Animated.Value(0)).current
  const [msg, setMsg] = useState('')
  const showToast = (text: string) => {
    setMsg(text)
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start()
      }, 1500)
    })
  }
  const toast = (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { backgroundColor: c.ink, opacity, bottom: 108 + bottomInset }]}
    >
      <Text style={{ color: c.paper, fontFamily: font.semi, fontSize: 13 }}>{msg}</Text>
    </Animated.View>
  )
  return { toast, showToast }
}

function Splash({ c }: { c: Palette }) {
  return (
    <View
      style={{ flex: 1, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' }}
    >
      <ActivityIndicator color={c.accent} />
    </View>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  navBtn: { alignItems: 'center', width: 72, paddingTop: 6 },
  scrim: { flex: 1, backgroundColor: 'rgba(20,8,14,0.42)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  grip: {
    width: 38,
    height: 4,
    borderRadius: 99,
    alignSelf: 'center',
    marginVertical: 6,
    marginBottom: 16,
  },
  sheetIco: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dCell: { flex: 1, borderWidth: 1, borderRadius: 15, paddingVertical: 13, alignItems: 'center' },
  ghost: { borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
})
