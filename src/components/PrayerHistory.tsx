import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import { PrayerLog } from '../hooks/usePrayerData'

interface PrayerHistoryProps {
  prayerLogs: PrayerLog[]
  weeklyStats: Array<{
    date: string
    completed: number
    total: number
    fullDate: Date
  }>
  monthlyStats: {
    totalPrayers: number
    averagePerDay: number
    mostPrayedTime: string
    totalDuration: number
  }
}

const PRAYER_COLORS = {
  'Fajr': 'bg-blue-500',
  'Dhuhr': 'bg-yellow-500',
  'Asr': 'bg-orange-500',
  'Maghrib': 'bg-purple-500',
  'Isha': 'bg-indigo-500'
}

export default function PrayerHistory({ prayerLogs, weeklyStats, monthlyStats }: PrayerHistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null)

  const getFilteredLogs = () => {
    let filtered = prayerLogs
    
    if (selectedPrayer) {
      filtered = filtered.filter(log => log.prayerName === selectedPrayer)
    }
    
    return filtered.slice(0, 50) // Limit to recent 50 entries
  }

  const getCalendarData = () => {
    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    return daysInMonth.map(day => {
      const dayLogs = prayerLogs.filter(log => 
        isSameDay(new Date(log.loggedAt), day)
      )
      const uniquePrayers = new Set(dayLogs.map(log => log.prayerName))
      
      return {
        date: day,
        completed: uniquePrayers.size,
        total: 5,
        logs: dayLogs
      }
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const calendarData = getCalendarData()
  const filteredLogs = getFilteredLogs()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prayer Timeline
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <select 
                    value={selectedPrayer || ''} 
                    onChange={(e) => setSelectedPrayer(e.target.value || null)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="">All Prayers</option>
                    <option value="Fajr">Fajr</option>
                    <option value="Dhuhr">Dhuhr</option>
                    <option value="Asr">Asr</option>
                    <option value="Maghrib">Maghrib</option>
                    <option value="Isha">Isha</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No prayer logs found</p>
                  <p className="text-sm">Start logging your prayers to see them here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${PRAYER_COLORS[log.prayerName as keyof typeof PRAYER_COLORS] || 'bg-gray-500'}`}></div>
                        <div>
                          <p className="font-medium">{log.prayerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.loggedAt), 'MMM d, yyyy • h:mm a')}
                          </p>
                          {log.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.durationMinutes && (
                          <Badge variant="secondary">
                            {formatDuration(log.durationMinutes)}
                          </Badge>
                        )}
                        {isToday(new Date(log.loggedAt)) && (
                          <Badge className="bg-green-500">Today</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Prayer Calendar
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[120px] text-center">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarData.map((day, index) => {
                  const completionRate = (day.completed / day.total) * 100
                  const isCurrentDay = isToday(day.date)
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square p-2 rounded-lg border text-center relative ${
                        isCurrentDay ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {format(day.date, 'd')}
                      </div>
                      <div className="mt-1">
                        <Progress value={completionRate} className="h-1" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {day.completed}/5
                      </div>
                      {day.completed === 5 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>All prayers completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary rounded-full"></div>
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {monthlyStats.totalPrayers}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Prayers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {monthlyStats.averagePerDay.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg/Day</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Most Prayed:</span>
                    <span className="font-medium">{monthlyStats.mostPrayedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Duration:</span>
                    <span className="font-medium">{formatDuration(monthlyStats.totalDuration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyStats.map((day, index) => (
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

          <Card>
            <CardHeader>
              <CardTitle>Prayer Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(PRAYER_COLORS).map(([prayer, color]) => {
                  const prayerCount = prayerLogs.filter(log => log.prayerName === prayer).length
                  const percentage = prayerLogs.length > 0 ? (prayerCount / prayerLogs.length) * 100 : 0
                  
                  return (
                    <div key={prayer} className="text-center">
                      <div className={`w-8 h-8 ${color} rounded-full mx-auto mb-2`}></div>
                      <div className="text-sm font-medium">{prayer}</div>
                      <div className="text-xs text-muted-foreground">{prayerCount} times</div>
                      <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}