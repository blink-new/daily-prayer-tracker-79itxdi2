import { useEffect, useRef } from 'react'
import { PrayerReminder } from './usePrayerData'
import { toast } from 'sonner'

export const useNotifications = (reminders: PrayerReminder[], enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const notifiedToday = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || reminders.length === 0) return

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Check reminders every minute
    intervalRef.current = setInterval(() => {
      checkReminders()
    }, 60000) // Check every minute

    // Initial check
    checkReminders()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [reminders, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset notifications at midnight
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    const resetTimeout = setTimeout(() => {
      notifiedToday.current.clear()
      
      // Set up daily reset
      const dailyReset = setInterval(() => {
        notifiedToday.current.clear()
      }, 24 * 60 * 60 * 1000)

      return () => clearInterval(dailyReset)
    }, msUntilMidnight)

    return () => clearTimeout(resetTimeout)
  }, [])

  const checkReminders = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    reminders.forEach(reminder => {
      if (!reminder.isEnabled) return
      
      const reminderKey = `${reminder.prayerName}_${currentTime}`
      
      if (reminder.reminderTime === currentTime && !notifiedToday.current.has(reminderKey)) {
        showNotification(reminder)
        notifiedToday.current.add(reminderKey)
      }
    })
  }

  const showNotification = (reminder: PrayerReminder) => {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Time for ${reminder.prayerName} Prayer`, {
        body: `It's time for your ${reminder.prayerName} prayer. May Allah accept your worship.`,
        icon: '/favicon.svg',
        tag: reminder.prayerName,
        requireInteraction: false
      })
    }

    // Toast notification as fallback
    toast(`🕌 Time for ${reminder.prayerName} Prayer`, {
      description: `It's time for your ${reminder.prayerName} prayer. May Allah accept your worship.`,
      duration: 10000,
      action: {
        label: 'Dismiss',
        onClick: () => {}
      }
    })

    // Play notification sound (optional)
    playNotificationSound()
  }

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }

  const testNotification = (prayerName: string) => {
    const testReminder: PrayerReminder = {
      id: 'test',
      userId: 'test',
      prayerName,
      reminderTime: '',
      isEnabled: true
    }
    showNotification(testReminder)
  }

  return {
    testNotification
  }
}