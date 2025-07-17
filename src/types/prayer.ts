export interface Prayer {
  id: string
  user_id: string
  prayer_name: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  notes?: string
  logged_at: string
  created_at: string
  updated_at: string
}

export interface PrayerReminder {
  id: string
  user_id: string
  prayer_name: string
  reminder_time: string // Format: "HH:MM"
  is_enabled: string // SQLite boolean as "0" or "1"
  days_of_week: string // Comma-separated days (1=Monday, 7=Sunday)
  created_at: string
  updated_at: string
}

export interface PrayerStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_prayer_date?: string
  total_prayers: number
  created_at: string
  updated_at: string
}

export interface PrayerSession {
  id: string
  prayer_name: string
  start_time: Date
  is_active: boolean
}

export interface PrayerStats {
  totalPrayers: number
  currentStreak: number
  longestStreak: number
  averageDuration: number
  completionRate: number
  weeklyStats: {
    date: string
    completed: number
    total: number
  }[]
}

export const DAILY_PRAYERS = [
  { name: 'Fajr', time: '5:30 AM', color: 'bg-blue-500' },
  { name: 'Dhuhr', time: '12:30 PM', color: 'bg-yellow-500' },
  { name: 'Asr', time: '3:30 PM', color: 'bg-orange-500' },
  { name: 'Maghrib', time: '6:30 PM', color: 'bg-purple-500' },
  { name: 'Isha', time: '8:00 PM', color: 'bg-indigo-500' }
] as const