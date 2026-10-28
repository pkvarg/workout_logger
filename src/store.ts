import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PocketBase, { AsyncAuthStore, type RecordModel } from 'pocketbase'
import type {
  ActivityType,
  Exercise,
  NewSession,
  Profile,
  Session,
  TrainingPlan,
  Workout,
  WorkoutSet,
} from './types'

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
  avatarUrl: null,
})

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function loadAvatarDataUri(client: PocketBase, record: RecordModel): Promise<string | null> {
  const filename = record.avatar as string | undefined
  if (!filename) return null
  try {
    const token = await client.files.getToken()
    const url = client.files.getURL(record, filename, { token })
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await blobToDataUri(blob)
  } catch {
    return null
  }
}

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
    if (raw) return { ...(JSON.parse(raw) as Profile), avatarUrl: null }
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
    avatarUrl: await loadAvatarDataUri(client, r),
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
  await AsyncStorage.multiRemove([
    LOCAL_SESSIONS,
    LOCAL_PROFILE,
    LOCAL_EXERCISES,
    LOCAL_WORKOUTS,
    LOCAL_SETS,
    LOCAL_ACTIVITY_TYPES,
    LOCAL_PLANS,
    LOCAL_PLAN_EXERCISES,
  ])
}

const LOCAL_EXERCISES = 'sl.exercises'
const LOCAL_WORKOUTS = 'sl.workouts'
const LOCAL_SETS = 'sl.sets'
const LOCAL_ACTIVITY_TYPES = 'sl.activityTypes'
const LOCAL_PLANS = 'sl.plans'
const LOCAL_PLAN_EXERCISES = 'sl.planExercises'

const STARTER_ACTIVITY_TYPES: { name: string; icon: string }[] = [
  { name: 'Personal training', icon: '🏋️' },
]

export async function fetchActivityTypes(): Promise<ActivityType[]> {
  if (DEMO_MODE) {
    const raw = await AsyncStorage.getItem(LOCAL_ACTIVITY_TYPES)
    if (raw) return JSON.parse(raw) as ActivityType[]
    const seeded = STARTER_ACTIVITY_TYPES.map((t, i) => ({
      id: `at${i}`,
      name: t.name,
      icon: t.icon,
    }))
    await AsyncStorage.setItem(LOCAL_ACTIVITY_TYPES, JSON.stringify(seeded))
    return seeded
  }
  const client = await ensureClient()
  const uid = userId(client)
  let records = await client
    .collection('activity_types')
    .getFullList({ filter: `user = "${uid}"`, sort: 'name' })
  if (records.length === 0) {
    for (const t of STARTER_ACTIVITY_TYPES) {
      await client.collection('activity_types').create({ user: uid, name: t.name, icon: t.icon })
    }
    records = await client
      .collection('activity_types')
      .getFullList({ filter: `user = "${uid}"`, sort: 'name' })
  }
  return records.map((r) => ({ id: r.id, name: r.name, icon: r.icon || null }))
}

export async function addActivityType(name: string, icon: string): Promise<ActivityType> {
  if (DEMO_MODE) {
    const list = await fetchActivityTypes()
    const t: ActivityType = { id: `at${Date.now()}`, name, icon: icon || null }
    list.push(t)
    await AsyncStorage.setItem(LOCAL_ACTIVITY_TYPES, JSON.stringify(list))
    return t
  }
  const client = await ensureClient()
  const uid = userId(client)
  const r = await client.collection('activity_types').create({ user: uid, name, icon })
  return { id: r.id, name: r.name, icon: r.icon || null }
}

export async function fetchTrainingPlans(): Promise<TrainingPlan[]> {
  if (DEMO_MODE) {
    const [praw, peraw, exraw] = await Promise.all([
      AsyncStorage.getItem(LOCAL_PLANS),
      AsyncStorage.getItem(LOCAL_PLAN_EXERCISES),
      AsyncStorage.getItem(LOCAL_EXERCISES),
    ])
    const plans = praw ? JSON.parse(praw) : []
    const links = peraw ? JSON.parse(peraw) : []
    const exercises: Exercise[] = exraw ? JSON.parse(exraw) : []
    return plans
      .map((p: { id: string; name: string; note: string | null }) => ({
        id: p.id,
        name: p.name,
        note: p.note ?? null,
        exercises: links
          .filter((l: { plan: string }) => l.plan === p.id)
          .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          .map((l: { exercise: string }) => exercises.find((e) => e.id === l.exercise))
          .filter((e: Exercise | undefined): e is Exercise => !!e),
      }))
      .sort((a: TrainingPlan, b: TrainingPlan) => a.name.localeCompare(b.name))
  }
  const client = await ensureClient()
  const uid = userId(client)
  const [plans, links] = await Promise.all([
    client.collection('training_plans').getFullList({ filter: `user = "${uid}"`, sort: 'name' }),
    client
      .collection('plan_exercises')
      .getFullList({ filter: `user = "${uid}"`, sort: 'position', expand: 'exercise' }),
  ])
  const byPlan = new Map<string, Exercise[]>()
  for (const l of links) {
    const ex = (l.expand as any)?.exercise
    if (!ex) continue
    const arr = byPlan.get(l.plan) ?? []
    arr.push({ id: ex.id, name: ex.name, muscle: ex.muscle || null })
    byPlan.set(l.plan, arr)
  }
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    note: p.note || null,
    exercises: byPlan.get(p.id) ?? [],
  }))
}

export async function createTrainingPlan(
  name: string,
  note: string,
  exerciseIds: string[],
): Promise<string> {
  if (DEMO_MODE) {
    const [praw, peraw] = await Promise.all([
      AsyncStorage.getItem(LOCAL_PLANS),
      AsyncStorage.getItem(LOCAL_PLAN_EXERCISES),
    ])
    const plans = praw ? JSON.parse(praw) : []
    const links = peraw ? JSON.parse(peraw) : []
    const id = `p${Date.now()}`
    plans.push({ id, name, note: note || null })
    exerciseIds.forEach((exercise, position) =>
      links.push({ id: `pe${Date.now()}${position}`, plan: id, exercise, position }),
    )
    await AsyncStorage.multiSet([
      [LOCAL_PLANS, JSON.stringify(plans)],
      [LOCAL_PLAN_EXERCISES, JSON.stringify(links)],
    ])
    return id
  }
  const client = await ensureClient()
  const uid = userId(client)
  const plan = await client.collection('training_plans').create({ user: uid, name, note })
  let position = 0
  for (const exercise of exerciseIds) {
    await client
      .collection('plan_exercises')
      .create({ user: uid, plan: plan.id, exercise, position })
    position += 1
  }
  return plan.id
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  if (DEMO_MODE) {
    const [praw, peraw] = await Promise.all([
      AsyncStorage.getItem(LOCAL_PLANS),
      AsyncStorage.getItem(LOCAL_PLAN_EXERCISES),
    ])
    const plans = (praw ? JSON.parse(praw) : []).filter((p: { id: string }) => p.id !== id)
    const links = (peraw ? JSON.parse(peraw) : []).filter((l: { plan: string }) => l.plan !== id)
    await AsyncStorage.multiSet([
      [LOCAL_PLANS, JSON.stringify(plans)],
      [LOCAL_PLAN_EXERCISES, JSON.stringify(links)],
    ])
    return
  }
  const client = await ensureClient()
  await client.collection('training_plans').delete(id)
}

const STARTER_EXERCISES: { name: string; muscle: string }[] = [
  { name: 'Bench Press', muscle: 'Chest' },
  { name: 'Squat', muscle: 'Legs' },
  { name: 'Deadlift', muscle: 'Back' },
  { name: 'Overhead Press', muscle: 'Shoulders' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Pull-up', muscle: 'Back' },
  { name: 'Lat Pulldown', muscle: 'Back' },
  { name: 'Bicep Curl', muscle: 'Arms' },
  { name: 'Tricep Pushdown', muscle: 'Arms' },
  { name: 'Leg Press', muscle: 'Legs' },
  { name: 'Romanian Deadlift', muscle: 'Legs' },
  { name: 'Plank', muscle: 'Core' },
]

export async function fetchExercises(): Promise<Exercise[]> {
  if (DEMO_MODE) {
    const raw = await AsyncStorage.getItem(LOCAL_EXERCISES)
    if (raw) return JSON.parse(raw) as Exercise[]
    const seeded = STARTER_EXERCISES.map((e, i) => ({
      id: `ex${i}`,
      name: e.name,
      muscle: e.muscle,
    }))
    await AsyncStorage.setItem(LOCAL_EXERCISES, JSON.stringify(seeded))
    return seeded
  }
  const client = await ensureClient()
  const uid = userId(client)
  let records = await client
    .collection('exercises')
    .getFullList({ filter: `user = "${uid}"`, sort: 'name' })
  if (records.length === 0) {
    for (const e of STARTER_EXERCISES) {
      await client.collection('exercises').create({ user: uid, name: e.name, muscle: e.muscle })
    }
    records = await client
      .collection('exercises')
      .getFullList({ filter: `user = "${uid}"`, sort: 'name' })
  }
  return records.map((r) => ({ id: r.id, name: r.name, muscle: r.muscle || null }))
}

export async function addExercise(name: string, muscle: string): Promise<Exercise> {
  if (DEMO_MODE) {
    const list = await fetchExercises()
    const ex: Exercise = { id: `ex${Date.now()}`, name, muscle: muscle || null }
    list.push(ex)
    await AsyncStorage.setItem(LOCAL_EXERCISES, JSON.stringify(list))
    return ex
  }
  const client = await ensureClient()
  const uid = userId(client)
  const r = await client.collection('exercises').create({ user: uid, name, muscle })
  return { id: r.id, name: r.name, muscle: r.muscle || null }
}

export async function fetchWorkouts(): Promise<Workout[]> {
  if (DEMO_MODE) {
    const [wraw, sraw, exraw, praw] = await Promise.all([
      AsyncStorage.getItem(LOCAL_WORKOUTS),
      AsyncStorage.getItem(LOCAL_SETS),
      AsyncStorage.getItem(LOCAL_EXERCISES),
      AsyncStorage.getItem(LOCAL_PLANS),
    ])
    const workouts = wraw ? JSON.parse(wraw) : []
    const sets = sraw ? JSON.parse(sraw) : []
    const exercises: Exercise[] = exraw ? JSON.parse(exraw) : []
    const plans = praw ? JSON.parse(praw) : []
    const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? ''
    const planNameOf = (id: string | null) =>
      id ? (plans.find((p: { id: string }) => p.id === id)?.name ?? null) : null
    return workouts
      .map(
        (w: { id: string; date: string; note: string | null; training_plan?: string | null }) => ({
          id: w.id,
          date: w.date,
          note: w.note ?? null,
          planId: w.training_plan ?? null,
          planName: planNameOf(w.training_plan ?? null),
          sets: sets
            .filter((s: { workout: string }) => s.workout === w.id)
            .sort((a: WorkoutSet, b: WorkoutSet) => a.setNumber - b.setNumber)
            .map((s: Omit<WorkoutSet, 'exerciseName'>) => ({
              id: s.id,
              exercise: s.exercise,
              exerciseName: nameOf(s.exercise),
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
            })),
        }),
      )
      .sort((a: Workout, b: Workout) => b.date.localeCompare(a.date))
  }
  const client = await ensureClient()
  const uid = userId(client)
  const [ws, ss] = await Promise.all([
    client
      .collection('workouts')
      .getFullList({ filter: `user = "${uid}"`, sort: '-date', expand: 'training_plan' }),
    client
      .collection('sets')
      .getFullList({ filter: `user = "${uid}"`, sort: 'set_number', expand: 'exercise' }),
  ])
  const byWorkout = new Map<string, WorkoutSet[]>()
  for (const s of ss) {
    const arr = byWorkout.get(s.workout) ?? []
    arr.push({
      id: s.id,
      exercise: s.exercise,
      exerciseName: (s.expand as any)?.exercise?.name ?? '',
      setNumber: Number(s.set_number),
      weight: Number(s.weight),
      reps: Number(s.reps),
    })
    byWorkout.set(s.workout, arr)
  }
  return ws.map((w) => ({
    id: w.id,
    date: String(w.date).slice(0, 10),
    note: w.note || null,
    planId: w.training_plan || null,
    planName: (w.expand as any)?.training_plan?.name ?? null,
    sets: byWorkout.get(w.id) ?? [],
  }))
}

export async function createWorkout(
  date: string,
  note: string,
  planId: string | null,
): Promise<string> {
  if (DEMO_MODE) {
    const raw = await AsyncStorage.getItem(LOCAL_WORKOUTS)
    const list = raw ? JSON.parse(raw) : []
    const id = `w${Date.now()}`
    list.push({ id, date, note: note || null, training_plan: planId ?? null })
    await AsyncStorage.setItem(LOCAL_WORKOUTS, JSON.stringify(list))
    return id
  }
  const client = await ensureClient()
  const uid = userId(client)
  const r = await client
    .collection('workouts')
    .create({ user: uid, date, note, training_plan: planId ?? '' })
  return r.id
}

export async function addSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
): Promise<void> {
  if (DEMO_MODE) {
    const raw = await AsyncStorage.getItem(LOCAL_SETS)
    const list = raw ? JSON.parse(raw) : []
    list.push({
      id: `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      workout: workoutId,
      exercise: exerciseId,
      setNumber,
      weight,
      reps,
    })
    await AsyncStorage.setItem(LOCAL_SETS, JSON.stringify(list))
    return
  }
  const client = await ensureClient()
  const uid = userId(client)
  await client.collection('sets').create({
    user: uid,
    workout: workoutId,
    exercise: exerciseId,
    set_number: setNumber,
    weight,
    reps,
  })
}

export async function deleteWorkout(id: string): Promise<void> {
  if (DEMO_MODE) {
    const [wraw, sraw] = await Promise.all([
      AsyncStorage.getItem(LOCAL_WORKOUTS),
      AsyncStorage.getItem(LOCAL_SETS),
    ])
    const workouts = (wraw ? JSON.parse(wraw) : []).filter((w: { id: string }) => w.id !== id)
    const sets = (sraw ? JSON.parse(sraw) : []).filter((s: { workout: string }) => s.workout !== id)
    await AsyncStorage.multiSet([
      [LOCAL_WORKOUTS, JSON.stringify(workouts)],
      [LOCAL_SETS, JSON.stringify(sets)],
    ])
    return
  }
  const client = await ensureClient()
  await client.collection('workouts').delete(id)
}
