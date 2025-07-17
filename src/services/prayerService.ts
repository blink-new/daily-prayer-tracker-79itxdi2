import { blink } from '../blink/client'
import { Prayer, PrayerReminder, PrayerStreak, PrayerStats } from '../types/prayer'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns'

export class PrayerService {
  // Get current user ID
  private static async getCurrentUserId(): Promise<string> {
    const user = await blink.auth.me()
    return user.id
  }

  // Prayer logging methods
  static async logPrayer(prayerName: string, startTime?: Date, endTime?: Date): Promise<Prayer> {
    const userId = await this.getCurrentUserId()
    const now = new Date().toISOString()
    const start = startTime ? startTime.toISOString() : now
    const end = endTime ? endTime.toISOString() : undefined
    const durationMinutes = startTime && endTime ? 
      Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : undefined

    const prayer: Prayer = {
      id: `prayer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      prayer_name: prayerName,
      start_time: start,
      end_time: end,
      duration_minutes: durationMinutes,
      logged_at: now,
      notes: '',
      created_at: now,
      updated_at: now
    }

    try {
      const result = await blink.db.prayers.create(prayer)
      // Update streak after logging prayer
      await this.updateStreak()
      return result
    } catch (error) {
      console.log('Database not available, using localStorage fallback')
      // Fallback to localStorage
      const storageKey = `prayers_${userId}`
      const existingPrayers = JSON.parse(localStorage.getItem(storageKey) || '[]')
      existingPrayers.unshift(prayer)
      localStorage.setItem(storageKey, JSON.stringify(existingPrayers))
      
      // Update streak after logging prayer
      await this.updateStreak()
      return prayer
    }
  }

  static async startPrayerTimer(prayerName: string, userId: string): Promise<Prayer> {
    const now = new Date().toISOString()
    const prayer: Omit<Prayer, 'id'> = {
      user_id: userId,
      prayer_name: prayerName,
      start_time: now,
      logged_at: now,
      notes: '',
      created_at: now,
      updated_at: now
    }

    return await blink.db.prayers.create({
      id: `prayer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...prayer
    })
  }

  static async endPrayerTimer(prayerId: string, durationMinutes: number): Promise<Prayer> {
    const now = new Date().toISOString()
    return await blink.db.prayers.update(prayerId, {
      end_time: now,
      duration_minutes: durationMinutes,
      updated_at: now
    })
  }

  // Prayer retrieval methods
  static async getTodaysPrayers(): Promise<Prayer[]> {
    const userId = await this.getCurrentUserId()
    const today = new Date()
    const startOfToday = startOfDay(today).toISOString()
    const endOfToday = endOfDay(today).toISOString()

    try {
      return await blink.db.prayers.list({
        where: {
          AND: [
            { user_id: userId },
            { logged_at: { gte: startOfToday } },
            { logged_at: { lte: endOfToday } }
          ]
        },
        orderBy: { logged_at: 'desc' }
      })
    } catch (error) {
      console.log('Database not available, using localStorage fallback')
      // Fallback to localStorage
      const storageKey = `prayers_${userId}`
      const allPrayers: Prayer[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return allPrayers.filter(prayer => 
        prayer.logged_at >= startOfToday && prayer.logged_at <= endOfToday
      )
    }
  }

  static async getPrayerHistory(limit: number = 20): Promise<Prayer[]> {
    const userId = await this.getCurrentUserId()
    try {
      return await blink.db.prayers.list({
        where: { user_id: userId },
        orderBy: { logged_at: 'desc' },
        limit
      })
    } catch (error) {
      console.log('Database not available, using localStorage fallback')
      // Fallback to localStorage
      const storageKey = `prayers_${userId}`
      const allPrayers: Prayer[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return allPrayers.slice(0, limit)
    }
  }

  static async getPrayerHistoryByDays(days: number = 30): Promise<Prayer[]> {
    const userId = await this.getCurrentUserId()
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      return await blink.db.prayers.list({
        where: {
          AND: [
            { user_id: userId },
            { logged_at: { gte: startDate.toISOString() } },
            { logged_at: { lte: endDate.toISOString() } }
          ]
        },
        orderBy: { logged_at: 'desc' }
      })
    } catch (error) {
      console.log('Database not available, using localStorage fallback')
      // Fallback to localStorage
      const storageKey = `prayers_${userId}`
      const allPrayers: Prayer[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return allPrayers.filter(prayer => 
        prayer.logged_at >= startDate.toISOString() && prayer.logged_at <= endDate.toISOString()
      )
    }
  }

  // Streak management
  static async getStreak(): Promise<PrayerStreak> {
    const userId = await this.getCurrentUserId()
    return await this.getOrCreateStreak(userId)
  }

  static async getOrCreateStreak(userId: string): Promise<PrayerStreak> {
    try {
      const existingStreak = await blink.db.prayer_streaks.list({
        where: { user_id: userId },
        limit: 1
      })

      if (existingStreak.length > 0) {
        return existingStreak[0]
      }

      // Create new streak record
      const now = new Date().toISOString()
      return await blink.db.prayer_streaks.create({
        id: `streak_${userId}`,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_prayers: 0,
        created_at: now,
        updated_at: now
      })
    } catch (error) {
      console.log('Database not available, using localStorage fallback for streak')
      // Fallback to localStorage
      const storageKey = `streak_${userId}`
      const existingStreak = localStorage.getItem(storageKey)
      
      if (existingStreak) {
        return JSON.parse(existingStreak)
      }
      
      // Create default streak
      const defaultStreak: PrayerStreak = {
        id: `streak_${userId}`,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_prayers: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem(storageKey, JSON.stringify(defaultStreak))
      return defaultStreak
    }
  }



  static async updateStreak(): Promise<void> {
    const userId = await this.getCurrentUserId()
    try {
      const streak = await this.getOrCreateStreak(userId)
      const todaysPrayers = await this.getTodaysPrayers()
      const totalPrayers = await this.getTotalPrayerCount()

      // Check if user completed all 5 prayers today
      const uniquePrayersToday = new Set(todaysPrayers.map(p => p.prayer_name))
      const completedToday = uniquePrayersToday.size === 5

      let newCurrentStreak = streak.current_streak
      let newLongestStreak = streak.longest_streak

      if (completedToday) {
        const today = format(new Date(), 'yyyy-MM-dd')
        const lastPrayerDate = streak.last_prayer_date

        if (lastPrayerDate) {
          const lastDate = format(parseISO(lastPrayerDate), 'yyyy-MM-dd')
          const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

          if (lastDate === yesterday) {
            // Consecutive day
            newCurrentStreak += 1
          } else if (lastDate !== today) {
            // Gap in streak, reset
            newCurrentStreak = 1
          }
          // If lastDate === today, don't change streak (already counted today)
        } else {
          // First time completing all prayers
          newCurrentStreak = 1
        }

        newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)

        const updatedStreak = {
          ...streak,
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_prayer_date: new Date().toISOString(),
          total_prayers: totalPrayers,
          updated_at: new Date().toISOString()
        }

        try {
          await blink.db.prayer_streaks.update(streak.id, updatedStreak)
        } catch (dbError) {
          console.log('Database not available, updating streak in localStorage')
          // Fallback to localStorage
          const storageKey = `streak_${userId}`
          localStorage.setItem(storageKey, JSON.stringify(updatedStreak))
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error)
    }
  }

  static async getTotalPrayerCount(): Promise<number> {
    const userId = await this.getCurrentUserId()
    try {
      const prayers = await blink.db.prayers.list({
        where: { user_id: userId }
      })
      return prayers.length
    } catch (error) {
      console.log('Database not available, counting prayers from localStorage')
      // Fallback to localStorage
      const storageKey = `prayers_${userId}`
      const allPrayers: Prayer[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return allPrayers.length
    }
  }

  // Statistics
  static async getPrayerStats(): Promise<PrayerStats> {
    const userId = await this.getCurrentUserId()
    try {
      const [prayers, streak] = await Promise.all([
        this.getPrayerHistoryByDays(30),
        this.getOrCreateStreak(userId)
      ])

      const totalPrayers = prayers.length
      const prayersWithDuration = prayers.filter(p => p.duration_minutes)
      const averageDuration = prayersWithDuration.length > 0
        ? prayersWithDuration.reduce((sum, p) => sum + (p.duration_minutes || 0), 0) / prayersWithDuration.length
        : 0

      // Calculate weekly stats
      const weekStart = startOfWeek(new Date())
      const weekEnd = endOfWeek(new Date())
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

      const weeklyStats = daysInWeek.map(day => {
        const dayStart = startOfDay(day).toISOString()
        const dayEnd = endOfDay(day).toISOString()
        const dayPrayers = prayers.filter(p => 
          p.logged_at >= dayStart && p.logged_at <= dayEnd
        )
        const uniquePrayers = new Set(dayPrayers.map(p => p.prayer_name))
        
        return {
          date: format(day, 'EEE'),
          completed: uniquePrayers.size,
          total: 5
        }
      })

      // Calculate completion rate (percentage of days with all 5 prayers)
      const completeDays = weeklyStats.filter(day => day.completed === 5).length
      const completionRate = (completeDays / 7) * 100

      return {
        totalPrayers,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        averageDuration: Math.round(averageDuration),
        completionRate: Math.round(completionRate),
        weeklyStats
      }
    } catch (error) {
      console.error('Error getting prayer stats:', error)
      // Return default stats with proper weekly structure
      const weekStart = startOfWeek(new Date())
      const weekEnd = endOfWeek(new Date())
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
      
      const defaultWeeklyStats = daysInWeek.map(day => ({
        date: format(day, 'EEE'),
        completed: 0,
        total: 5
      }))

      return {
        totalPrayers: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageDuration: 0,
        completionRate: 0,
        weeklyStats: defaultWeeklyStats
      }
    }
  }

  // Reminder management
  static async createReminder(prayerName: string, reminderTime: string): Promise<PrayerReminder> {
    const userId = await this.getCurrentUserId()
    const now = new Date().toISOString()
    const reminder: PrayerReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      prayer_name: prayerName,
      reminder_time: reminderTime,
      is_enabled: "1",
      days_of_week: "1,2,3,4,5,6,7", // All days by default
      created_at: now,
      updated_at: now
    }

    try {
      return await blink.db.prayer_reminders.create(reminder)
    } catch (error) {
      console.log('Database not available, using localStorage fallback for reminders')
      // Fallback to localStorage
      const storageKey = `reminders_${userId}`
      const existingReminders = JSON.parse(localStorage.getItem(storageKey) || '[]')
      existingReminders.push(reminder)
      localStorage.setItem(storageKey, JSON.stringify(existingReminders))
      return reminder
    }
  }

  static async getUserReminders(): Promise<PrayerReminder[]> {
    const userId = await this.getCurrentUserId()
    try {
      return await blink.db.prayer_reminders.list({
        where: { user_id: userId },
        orderBy: { reminder_time: 'asc' }
      })
    } catch (error) {
      console.log('Database not available, using localStorage fallback for reminders')
      // Fallback to localStorage
      const storageKey = `reminders_${userId}`
      const reminders: PrayerReminder[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return reminders.sort((a, b) => a.reminder_time.localeCompare(b.reminder_time))
    }
  }

  static async updateReminder(reminderId: string, updates: Partial<PrayerReminder>): Promise<PrayerReminder> {
    const userId = await this.getCurrentUserId()
    const updatedReminder = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    try {
      return await blink.db.prayer_reminders.update(reminderId, updatedReminder)
    } catch (error) {
      console.log('Database not available, using localStorage fallback for reminder update')
      // Fallback to localStorage
      const storageKey = `reminders_${userId}`
      const reminders: PrayerReminder[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const index = reminders.findIndex(r => r.id === reminderId)
      if (index !== -1) {
        reminders[index] = { ...reminders[index], ...updatedReminder }
        localStorage.setItem(storageKey, JSON.stringify(reminders))
        return reminders[index]
      }
      throw new Error('Reminder not found')
    }
  }

  static async deleteReminder(reminderId: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    try {
      await blink.db.prayer_reminders.delete(reminderId)
    } catch (error) {
      console.log('Database not available, using localStorage fallback for reminder deletion')
      // Fallback to localStorage
      const storageKey = `reminders_${userId}`
      const reminders: PrayerReminder[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const filteredReminders = reminders.filter(r => r.id !== reminderId)
      localStorage.setItem(storageKey, JSON.stringify(filteredReminders))
    }
  }

  // Notification helpers
  static checkForDueReminders(reminders: PrayerReminder[]): PrayerReminder[] {
    const now = new Date()
    const currentTime = format(now, 'HH:mm')
    const currentDay = now.getDay() || 7 // Convert Sunday (0) to 7

    return reminders.filter(reminder => {
      if (Number(reminder.is_enabled) === 0) return false
      
      const daysOfWeek = reminder.days_of_week.split(',').map(d => parseInt(d))
      if (!daysOfWeek.includes(currentDay)) return false
      
      return reminder.reminder_time === currentTime
    })
  }

  static requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.resolve('denied')
    }
    
    return Notification.requestPermission()
  }

  static showNotification(prayerName: string): void {
    if (Notification.permission === 'granted') {
      new Notification(`Time for ${prayerName} Prayer`, {
        body: `It's time for your ${prayerName} prayer. May Allah accept your prayers.`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `prayer-${prayerName}`,
        requireInteraction: true
      })
    }
  }
}