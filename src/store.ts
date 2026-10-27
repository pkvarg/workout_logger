import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PocketBase, { AsyncAuthStore } from 'pocketbase'
import type { NewSession, Profile, Session } from './types'

const url = process.env.EXPO_PUBLIC_POCKETBASE_URL ?? ''

export const DEMO_MODE = !url

const PB_AUTH = 'pb_auth'
const LOCAL_SESSIONS = 'sl.sessions'
const LOCAL_PROFILE = 'sl.profile'
const LOCAL_AUTH = 'sl.auth'

let pb: PocketBase | null = null

async function ensureClient(): Promise<PocketBase> {
  if (pb) return pb
  const initial = await AsyncStorage.getItem(PB_AUTH)
  const authStore = new AsyncAuthStore({
    save: (serialized) => AsyncStorage.setItem(PB_AUTH, serialized),
    clear: () => AsyncStorage.removeItem(PB_AUTH),
    initial: initial ?? undefined,
  })
  pb = new PocketBase(url, authStore)
  return pb
}

function userId(client: PocketBase): string {
  const id = client.authStore.record?.id
  if (!id) throw new Error('Not signed in')
  return id
}

export const defaultProfile = (name = 'Ella'): Profile => ({
  name,
  defaultRate: 18,
  currency: 'EUR',
  monthlyGoal: 20,
})

function seedSessions(): Session[] {
  const d = (back: number) => {
    const x = new Date()
    x.setDate(x.getDate() - back)
    return x.toISOString().slice(0, 10)
  }
  return [
    { id: '1', activity: 'Reformer Pilates', icon: '🤸', date: d(1), hours: 1, rate: 18 },
    { id: '2', activity: 'Personal training', icon: '🏋️', date: d(4), hours: 1.5, rate: 22 },
    { id: '3', activity: 'Ballet', icon: '🩰', date: d(9), hours: 1, rate: 16 },
    { id: '4', activity: 'Reformer Pilates', icon: '🤸', date: d(15), hours: 1, rate: 18 },
    { id: '5', activity: 'Yoga', icon: '🧘', date: d(38), hours: 1, rate: 14 },
    { id: '6', activity: 'Personal training', icon: '🏋️', date: d(45), hours: 1.5, rate: 22 },
  ]
}

export async function hasSession(): Promise<boolean> {
  if (DEMO_MODE) return (await AsyncStorage.getItem(LOCAL_AUTH)) === '1'
  const client = await ensureClient()
  return client.authStore.isValid
}

export async function signIn(email: string, password: string): Promise<void> {
  if (DEMO_MODE) {
    await AsyncStorage.setItem(LOCAL_AUTH, '1')
    return
  }
  const client = await ensureClient()
  await client.collection('users').authWithPassword(email, password)
}

export async function signUp(email: string, password: string, name: string): Promise<void> {
  if (DEMO_MODE) {
    await AsyncStorage.setItem(LOCAL_AUTH, '1')
    await AsyncStorage.setItem(LOCAL_PROFILE, JSON.stringify(defaultProfile(name)))
    return
  }
  const client = await ensureClient()
  await client.collection('users').create({
    email,
    password,
    passwordConfirm: password,
    name,
    default_rate: 18,
    currency: 'EUR',
    monthly_goal: 20,
  })
  await client.collection('users').authWithPassword(email, password)
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) {
    await AsyncStorage.removeItem(LOCAL_AUTH)
    return
  }
  const client = await ensureClient()
  client.authStore.clear()
}

export async function fetchProfile(): Promise<Profile> {
  if (DEMO_MODE) {
    const raw = await AsyncStorage.getItem(LOCAL_PROFILE)
    if (raw) return JSON.parse(raw) as Profile
    const p = defaultProfile()
    await AsyncStorage.setItem(LOCAL_PROFILE, JSON.stringify(p))
    return p
  }
  const client = await ensureClient()
  const r = await client.collection('users').getOne(userId(client))
  return {
    name: r.name ?? '',
    defaultRate: Number(r.default_rate ?? 0),
    currency: r.currency ?? 'EUR',
    monthlyGoal: Number(r.monthly_goal ?? 20),
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  if (DEMO_MODE) {
    await AsyncStorage.setItem(LOCAL_PROFILE, JSON.stringify(p))
    return
  }
  const client = await ensureClient()
  await client.collection('users').update(userId(client), {
    name: p.name,
    default_rate: p.defaultRate,
    currency: p.currency,
    monthly_goal: p.monthlyGoal,
  })
}

export async function fetchSessions(): Promise<Session[]> {
  if (DEMO_MODE) {
    const raw = await AsyncStorage.getItem(LOCAL_SESSIONS)
    if (raw) return JSON.parse(raw) as Session[]
    const seed = seedSessions()
    await AsyncStorage.setItem(LOCAL_SESSIONS, JSON.stringify(seed))
    return seed
  }
  const client = await ensureClient()
  const records = await client.collection('sessions').getFullList({
    filter: `user = "${userId(client)}"`,
    sort: '-session_date',
  })
  return records.map((r) => ({
    id: r.id,
    activity: r.activity,
    icon: r.icon || null,
    date: String(r.session_date).slice(0, 10),
    hours: Number(r.hours),
    rate: Number(r.rate),
  }))
}

export async function addSession(s: NewSession): Promise<void> {
  if (DEMO_MODE) {
    const list = await fetchSessions()
    list.push({ ...s, id: String(Date.now()) })
    await AsyncStorage.setItem(LOCAL_SESSIONS, JSON.stringify(list))
    return
  }
  const client = await ensureClient()
  await client.collection('sessions').create({
    user: userId(client),
    activity: s.activity,
    icon: s.icon,
    session_date: s.date,
    hours: s.hours,
    rate: s.rate,
  })
}

export async function deleteSession(id: string): Promise<void> {
  if (DEMO_MODE) {
    const list = (await fetchSessions()).filter((x) => x.id !== id)
    await AsyncStorage.setItem(LOCAL_SESSIONS, JSON.stringify(list))
    return
  }
  const client = await ensureClient()
  await client.collection('sessions').delete(id)
}

export async function resetDemoData(): Promise<void> {
  await AsyncStorage.multiRemove([LOCAL_SESSIONS, LOCAL_PROFILE])
}
