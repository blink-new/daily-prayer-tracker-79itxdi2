import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { toast } from 'sonner'

export interface PrayerLog {
  id: string
  userId: string
  prayerName: string
  loggedAt: string
  durationMinutes?: number
  notes?: string
  createdAt: string
}

export interface PrayerReminder {
  id: string
  userId: string
  prayerName: string
  reminderTime: string
  isEnabled: boolean
}

export interface PrayerStreak {
  currentStreak: number
  longestStreak: number
  lastPrayerDate: string
}

export const usePrayerData = (userId: string) => {
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([])
  const [reminders, setReminders] = useState<PrayerReminder[]>([])
  const [streak, setStreak] = useState<PrayerStreak>({
    currentStreak: 0,
    longestStreak: 0,
    lastPrayerDate: ''
  })
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadPrayerData()
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPrayerData = async () => {
    try {
      setLoading(true)
      
      // Load from localStorage as fallback (since database creation failed)
      const storedLogs = localStorage.getItem(`prayer_logs_${userId}`)
      const storedReminders = localStorage.getItem(`prayer_reminders_${userId}`)
      const storedStreak = localStorage.getItem(`prayer_streak_${userId}`)

      if (storedLogs) {
        setPrayerLogs(JSON.parse(storedLogs))
      }
      
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders))
      } else {
        // Set default reminders
        const defaultReminders: PrayerReminder[] = [
          { id: '1', userId, prayerName: 'Fajr', reminderTime: '05:30', isEnabled: true },
          { id: '2', userId, prayerName: 'Dhuhr', reminderTime: '12:30', isEnabled: true },
          { id: '3', userId, prayerName: 'Asr', reminderTime: '15:30', isEnabled: true },
          { id: '4', userId, prayerName: 'Maghrib', reminderTime: '18:30', isEnabled: true },
          { id: '5', userId, prayerName: 'Isha', reminderTime: '20:00', isEnabled: true }
        ]
        setReminders(defaultReminders)
        localStorage.setItem(`prayer_reminders_${userId}`, JSON.stringify(defaultReminders))
      }

      if (storedStreak) {
        setStreak(JSON.parse(storedStreak))
      }

    } catch (error) {
      console.error('Error loading prayer data:', error)
      toast.error('Failed to load prayer data')
    } finally {
      setLoading(false)
    }
  }

  const logPrayer = async (prayerName: string, durationMinutes?: number, notes?: string) => {
    try {
      const newLog: PrayerLog = {
        id: `prayer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        prayerName,
        loggedAt: new Date().toISOString(),
        durationMinutes,
        notes: notes || '',
        createdAt: new Date().toISOString()
      }

      const updatedLogs = [newLog, ...prayerLogs]
      setPrayerLogs(updatedLogs)
      localStorage.setItem(`prayer_logs_${userId}`, JSON.stringify(updatedLogs))

      // Update streak
      await updateStreak(prayerName)

      toast.success(`${prayerName} prayer logged successfully! 🤲`, {
        description: 'May your prayers be accepted.'
      })

      return newLog
    } catch (error) {
      console.error('Error logging prayer:', error)
      toast.error('Failed to log prayer')
      throw error
    }
  }

  const updateStreak = async (prayerName: string) => {
    try {
      const today = new Date().toDateString()
      const todayLogs = prayerLogs.filter(log => 
        new Date(log.loggedAt).toDateString() === today
      )
      
      // Check if all 5 prayers are completed today
      const todayPrayers = new Set(todayLogs.map(log => log.prayerName))
      todayPrayers.add(prayerName) // Add the current prayer
      
      if (todayPrayers.size === 5) {
        const newStreak = {
          currentStreak: streak.currentStreak + 1,
          longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
          lastPrayerDate: today
        }
        setStreak(newStreak)
        localStorage.setItem(`prayer_streak_${userId}`, JSON.stringify(newStreak))
        
        toast.success('All 5 prayers completed today! 🎉', {
          description: `Current streak: ${newStreak.currentStreak} days`
        })
      }
    } catch (error) {
      console.error('Error updating streak:', error)
    }
  }

  const updateReminder = async (reminderId: string, updates: Partial<PrayerReminder>) => {
    try {
      const updatedReminders = reminders.map(reminder =>
        reminder.id === reminderId ? { ...reminder, ...updates } : reminder
      )
      setReminders(updatedReminders)
      localStorage.setItem(`prayer_reminders_${userId}`, JSON.stringify(updatedReminders))
      
      toast.success('Reminder updated successfully')
    } catch (error) {
      console.error('Error updating reminder:', error)
      toast.error('Failed to update reminder')
    }
  }

  const getTodaysPrayers = () => {
    const today = new Date().toDateString()
    return prayerLogs.filter(log => 
      new Date(log.loggedAt).toDateString() === today
    )
  }

  const getWeeklyStats = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weeklyLogs = prayerLogs.filter(log => 
      new Date(log.loggedAt) >= weekAgo
    )

    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayLogs = weeklyLogs.filter(log => 
        new Date(log.loggedAt).toDateString() === date.toDateString()
      )
      const uniquePrayers = new Set(dayLogs.map(log => log.prayerName))
      
      dailyStats.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: uniquePrayers.size,
        total: 5,
        fullDate: date
      })
    }
    
    return dailyStats
  }

  const getMonthlyStats = () => {
    const now = new Date()
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    const monthlyLogs = prayerLogs.filter(log => 
      new Date(log.loggedAt) >= monthAgo
    )

    return {
      totalPrayers: monthlyLogs.length,
      averagePerDay: monthlyLogs.length / 30,
      mostPrayedTime: getMostPrayedTime(monthlyLogs),
      totalDuration: monthlyLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0)
    }
  }

  const getMostPrayedTime = (logs: PrayerLog[]) => {
    const prayerCounts = logs.reduce((acc, log) => {
      acc[log.prayerName] = (acc[log.prayerName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(prayerCounts).reduce((a, b) => 
      prayerCounts[a[0]] > prayerCounts[b[0]] ? a : b
    )?.[0] || 'None'
  }

  return {
    prayerLogs,
    reminders,
    streak,
    loading,
    logPrayer,
    updateReminder,
    getTodaysPrayers,
    getWeeklyStats,
    getMonthlyStats,
    loadPrayerData
  }
}