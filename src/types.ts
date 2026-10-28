export type Session = {
  id: string
  activity: string
  icon: string | null
  date: string
  hours: number
  rate: number
}

export type Profile = {
  name: string
  defaultRate: number
  currency: string
  monthlyGoal: number
  avatarUrl: string | null
}

export type NewSession = Omit<Session, 'id'>

export type Exercise = {
  id: string
  name: string
  muscle: string | null
}

export type WorkoutSet = {
  id: string
  exercise: string
  exerciseName: string
  setNumber: number
  weight: number
  reps: number
}

export type Workout = {
  id: string
  date: string
  note: string | null
  planId: string | null
  planName: string | null
  sets: WorkoutSet[]
}

export type ActivityType = {
  id: string
  name: string
  icon: string | null
}

export type TrainingPlan = {
  id: string
  name: string
  note: string | null
  exercises: Exercise[]
}
