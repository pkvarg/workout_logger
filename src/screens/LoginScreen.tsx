import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DEMO_MODE, signIn, signUp } from '../store'
import type { Palette } from '../theme'
import { font, radius } from '../theme'

export default function LoginScreen({ c, onDone }: { c: Palette; onDone: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('Ella')
  const [email, setEmail] = useState('ella@studio.me')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null)
  const [kb, setKb] = useState(0)

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKb(e.endCoordinates?.height ?? 0)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
    })
    const hideSub = Keyboard.addListener(hideEvt, () => setKb(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const revealField = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
  }

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      if (mode === 'up') await signUp(email.trim(), password, name.trim())
      else await signIn(email.trim(), password)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: kb > 0 ? kb + 24 : 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[c.accent, c.accentSoft]}
          start={{ x: 0.9, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.art}
        >
          <Text style={[styles.mark, { color: c.onAccent }]}>Studio Ledger</Text>
          <Text style={[styles.artHead, { color: c.onAccent }]}>
            Every hour, gently accounted for.
          </Text>
        </LinearGradient>

        <View style={[styles.form, { backgroundColor: c.paper }]}>
          <Text style={{ color: c.muted, fontFamily: font.regular, fontSize: 14, marginBottom: 4 }}>
            {mode === 'in'
              ? 'Welcome back. Sign in to pick up where you left off.'
              : 'Create your account to start tracking.'}
          </Text>

          {mode === 'up' && (
            <Field
              c={c}
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              onFocus={revealField}
            />
          )}
          <Field
            c={c}
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={revealField}
          />
          <Field
            c={c}
            label="Passcode"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={DEMO_MODE ? 'any value works in demo' : ''}
            onFocus={revealField}
          />

          {error && (
            <Text style={{ color: c.danger, fontFamily: font.medium, fontSize: 13 }}>{error}</Text>
          )}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: c.accent, opacity: pressed || busy ? 0.9 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>
                {mode === 'in' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')}>
            <Text
              style={{
                textAlign: 'center',
                color: c.muted,
                fontFamily: font.regular,
                fontSize: 13,
              }}
            >
              {mode === 'in' ? 'New here? ' : 'Already have an account? '}
              <Text style={{ color: c.accentInk, fontFamily: font.semi }}>
                {mode === 'in' ? 'Create an account' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>

          {DEMO_MODE && (
            <Text
              style={{
                textAlign: 'center',
                color: c.muted,
                fontFamily: font.regular,
                fontSize: 11.5,
                opacity: 0.8,
              }}
            >
              Demo mode — data stays on this device until Supabase is connected.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function Field({
  c,
  label,
  ...props
}: { c: Palette; label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: c.muted, fontFamily: font.semi, fontSize: 12 }}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        style={[styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  art: {
    height: 260,
    justifyContent: 'flex-end',
    padding: 28,
    paddingTop: 70,
  },
  mark: {
    position: 'absolute',
    top: 54,
    left: 28,
    fontFamily: font.displayItalic,
    fontSize: 23,
  },
  artHead: { fontFamily: font.displayMedium, fontSize: 30, lineHeight: 34, maxWidth: 260 },
  form: { padding: 26, gap: 14 },
  input: {
    fontFamily: font.regular,
    fontSize: 15,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  primary: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
})
