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
}

export type NewSession = Omit<Session, 'id'>
