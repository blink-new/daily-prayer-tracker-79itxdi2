import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { 
  Heart, 
  Flame, 
  Calendar, 
  Clock, 
  Plus,
  TrendingUp,
  Moon,
  Sun,
  Timer,
  Bell,
  BarChart3,
  Settings
} from 'lucide-react'
import { format, isToday } from 'date-fns'
import { toast } from 'sonner'
import { Prayer, PrayerStreak, DAILY_PRAYERS } from '../types/prayer'
import { PrayerService } from '../services/prayerService'
import { blink } from '../blink/client'
import PrayerTimer from './PrayerTimer'
import ReminderSettings from './ReminderSettings'
import PrayerStats from './PrayerStats'

interface User {
  id: string
  email: string
  displayName?: string
}

interface PrayerDashboardProps {
  user: User
}

const MOTIVATIONAL_QUOTES = [
  "Prayer is the key to all the treasures of this life and the hereafter.",
  "The closest a servant comes to his Lord is when he is prostrating.",
  "Prayer is better than sleep.",
  "And establish prayer and give zakah and bow with those who bow.",
  "Verily, in the remembrance of Allah do hearts find rest.",
  "Prayer is the pillar of religion and the key to Paradise.",
  "When you stand up to pray, pray as if it is your last prayer.",
  "The first thing about which people will be questioned on the Day of Judgment is prayer."
]

export default function PrayerDashboard({ user }: PrayerDashboardProps) {
  const [todaysPrayers, setTodaysPrayers] = useState<Prayer[]>([])
  const [recentPrayers, setRecentPrayers] = useState<Prayer[]>([])
  const [streak, setStreak] = useState<PrayerStreak | null>(null)
  const [currentQuote, setCurrentQuote] = useState('')
  const [loading, setLoading] = useState(true)
  const [showTimer, setShowTimer] = useState(false)
  const [selectedPrayer, setSelectedPrayer] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    loadDashboardData()
    
    // Set random motivational quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
    setCurrentQuote(randomQuote)
  }, [loadDashboardData, user.id])

  const loadDashboardData = useCallback(async () => {
    try {
      const [todaysData, recentData, streakData] = await Promise.all([
        PrayerService.getTodaysPrayers(),
        PrayerService.getPrayerHistory(20),
        PrayerService.getStreak()
      ])
      
      setTodaysPrayers(todaysData || [])
      setRecentPrayers(recentData || [])
      setStreak(streakData || {
        id: `streak_${user.id}`,
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        total_prayers: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Set default values instead of showing error
      setTodaysPrayers([])
      setRecentPrayers([])
      setStreak({
        id: `streak_${user.id}`,
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        total_prayers: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [user.id])

  const logPrayer = async (prayerName: string) => {
    setLoading(true)
    try {
      await PrayerService.logPrayer(prayerName)
      
      // Reload data to reflect changes
      await loadDashboardData()
      
      toast.success(`${prayerName} prayer logged successfully! 🤲`, {
        description: 'May your prayers be accepted.'
      })

      // Check if this completes the day
      const uniquePrayerTypes = new Set([...todaysPrayers.map(p => p.prayer_name), prayerName])
      if (uniquePrayerTypes.size === 5) {
        toast.success('All 5 prayers completed today! 🎉', {
          description: 'Your dedication is inspiring.'
        })
      }
    } catch (error) {
      toast.error('Failed to log prayer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startTimedPrayer = (prayerName: string) => {
    setSelectedPrayer(prayerName)
    setShowTimer(true)
  }

  const handleTimerComplete = async (startTime: Date, endTime: Date, duration: number) => {
    try {
      await PrayerService.logPrayer(selectedPrayer, startTime, endTime)
      
      // Reload data to reflect changes
      await loadDashboardData()
      
      toast.success(`${selectedPrayer} prayer completed! Duration: ${duration} minutes 🤲`, {
        description: 'May your prayers be accepted.'
      })
      
      setShowTimer(false)
      setSelectedPrayer('')
    } catch (error) {
      toast.error('Failed to save prayer. Please try again.')
    }
  }

  const handleTimerCancel = () => {
    setShowTimer(false)
    setSelectedPrayer('')
  }

  const getTodaysProgress = () => {
    const uniquePrayerTypes = new Set(todaysPrayers.map(p => p.prayer_name))
    return (uniquePrayerTypes.size / 5) * 100
  }

  const isPrayerCompleted = (prayerName: string) => {
    return todaysPrayers.some(p => p.prayer_name === prayerName)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your prayer dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Daily Prayer Tracker
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user.displayName || user.email}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">{streak?.currentStreak || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Today's Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Set(todaysPrayers.map(p => p.prayer_name)).size} of 5 prayers completed
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(getTodaysProgress())}%
                    </span>
                  </div>
                  <Progress value={getTodaysProgress()} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Prayer Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Log Your Prayers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {DAILY_PRAYERS.map((prayer) => {
                    const isCompleted = isPrayerCompleted(prayer.name)
                    const Icon = prayer.name === 'Fajr' || prayer.name === 'Maghrib' || prayer.name === 'Isha' ? Moon : Sun
                    
                    return (
                      <div key={prayer.name} className="space-y-2">
                        <Button
                          variant={isCompleted ? "default" : "outline"}
                          className={`h-24 w-full flex-col gap-2 relative ${
                            isCompleted ? 'bg-primary text-primary-foreground' : ''
                          }`}
                          onClick={() => !isCompleted && logPrayer(prayer.name)}
                          disabled={loading || isCompleted}
                        >
                          {isCompleted && (
                            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white px-1 py-0 text-xs">
                              ✓
                            </Badge>
                          )}
                          <Icon className="h-6 w-6" />
                          <div className="text-center">
                            <div className="font-medium">{prayer.name}</div>
                            <div className="text-xs opacity-70">{prayer.time}</div>
                          </div>
                        </Button>
                        
                        {!isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center gap-1 text-xs"
                            onClick={() => startTimedPrayer(prayer.name)}
                          >
                            <Timer className="h-3 w-3" />
                            Time Prayer
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview & Motivational Quote */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{streak?.totalPrayers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Prayers</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-accent">{streak?.longestStreak || 0}</p>
                      <p className="text-sm text-muted-foreground">Best Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Daily Inspiration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-center italic text-muted-foreground leading-relaxed">
                    "{currentQuote}"
                  </blockquote>
                </CardContent>
              </Card>
            </div>

            {/* Recent Prayer Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Prayers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPrayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No prayers logged yet.</p>
                    <p className="text-sm">Start by logging your first prayer above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPrayers.slice(0, 10).map((prayer) => (
                      <div key={prayer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <div>
                            <p className="font-medium">{prayer.prayer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(prayer.start_time), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {prayer.duration_minutes && (
                            <Badge variant="secondary">
                              {prayer.duration_minutes}m
                            </Badge>
                          )}
                          {isToday(new Date(prayer.start_time)) && (
                            <Badge className="bg-green-500 text-white">
                              Today
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <PrayerStats />
          </TabsContent>

          <TabsContent value="reminders">
            <ReminderSettings />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Account Information</h3>
                    <p className="text-sm text-muted-foreground">Email: {user.email}</p>
                    {user.displayName && (
                      <p className="text-sm text-muted-foreground">Name: {user.displayName}</p>
                    )}
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Prayer Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Your prayer data is stored securely and synced across all your devices.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      blink.auth.logout()
                    }}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Prayer Timer Dialog */}
      <Dialog open={showTimer} onOpenChange={setShowTimer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prayer Timer</DialogTitle>
          </DialogHeader>
          <PrayerTimer
            prayerName={selectedPrayer}
            onComplete={handleTimerComplete}
            onCancel={handleTimerCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}