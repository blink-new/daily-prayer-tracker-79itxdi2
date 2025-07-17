import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  Target,
  Award,
  BarChart3,
  Activity
} from 'lucide-react'
import { PrayerService } from '../services/prayerService'

export default function PrayerStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsData = await PrayerService.getPrayerStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No statistics available yet.</p>
          <p className="text-sm">Start logging prayers to see your progress!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prayers</p>
                <p className="text-2xl font-bold">{stats.totalPrayers}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <Target className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="text-2xl font-bold">{stats.longestStreak}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{stats.averageDuration}m</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Completion Rate (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {Math.round(stats.completionRate)}% of prayers completed
              </span>
              <Badge 
                variant={stats.completionRate >= 80 ? "default" : stats.completionRate >= 60 ? "secondary" : "destructive"}
              >
                {stats.completionRate >= 80 ? 'Excellent' : stats.completionRate >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={stats.completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.weeklyStats.map((day: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium w-12">{day.date}</span>
                <div className="flex-1 mx-3">
                  <Progress 
                    value={(day.completed / day.total) * 100} 
                    className="h-2"
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {day.completed}/{day.total}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}