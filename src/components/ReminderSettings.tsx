import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Bell, BellOff, TestTube, Volume2 } from 'lucide-react'
import { PrayerReminder } from '../hooks/usePrayerData'
import { toast } from 'sonner'

interface ReminderSettingsProps {
  reminders: PrayerReminder[]
  onUpdateReminder: (reminderId: string, updates: Partial<PrayerReminder>) => void
  onTestNotification: (prayerName: string) => void
}

const PRAYER_TIMES = {
  'Fajr': '05:30',
  'Dhuhr': '12:30',
  'Asr': '15:30',
  'Maghrib': '18:30',
  'Isha': '20:00'
}

export default function ReminderSettings({ 
  reminders, 
  onUpdateReminder, 
  onTestNotification 
}: ReminderSettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  )

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
      
      if (permission === 'granted') {
        toast.success('Notifications enabled successfully!')
      } else {
        toast.error('Notification permission denied')
      }
    } else {
      toast.error('Notifications not supported in this browser')
    }
  }

  const handleTimeChange = (reminderId: string, newTime: string) => {
    onUpdateReminder(reminderId, { reminderTime: newTime })
  }

  const handleToggleReminder = (reminderId: string, enabled: boolean) => {
    onUpdateReminder(reminderId, { isEnabled: enabled })
  }

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const getNotificationStatus = () => {
    if (!('Notification' in window)) {
      return { status: 'unsupported', message: 'Not supported' }
    }
    
    switch (Notification.permission) {
      case 'granted':
        return { status: 'granted', message: 'Enabled' }
      case 'denied':
        return { status: 'denied', message: 'Blocked' }
      default:
        return { status: 'default', message: 'Not requested' }
    }
  }

  const notificationStatus = getNotificationStatus()

  return (
    <div className="space-y-6">
      {/* Notification Permission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when it's time for prayer
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={notificationStatus.status === 'granted' ? 'default' : 'secondary'}
                className={
                  notificationStatus.status === 'granted' 
                    ? 'bg-green-500' 
                    : notificationStatus.status === 'denied' 
                    ? 'bg-red-500' 
                    : 'bg-yellow-500'
                }
              >
                {notificationStatus.message}
              </Badge>
              {notificationStatus.status !== 'granted' && (
                <Button 
                  onClick={requestNotificationPermission}
                  size="sm"
                  variant="outline"
                >
                  Enable
                </Button>
              )}
            </div>
          </div>

          {notificationStatus.status === 'granted' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Volume2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Notifications are working! You'll receive prayer reminders.
              </span>
            </div>
          )}

          {notificationStatus.status === 'denied' && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                Notifications are blocked. To enable:
              </p>
              <ol className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4">
                <li>1. Click the lock icon in your browser's address bar</li>
                <li>2. Set notifications to "Allow"</li>
                <li>3. Refresh this page</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prayer Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Prayer Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {reminder.isEnabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{reminder.prayerName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={reminder.reminderTime}
                      onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                      className="w-32"
                      disabled={!reminder.isEnabled}
                    />
                    <span className="text-sm text-muted-foreground">
                      ({formatTime12Hour(reminder.reminderTime)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTestNotification(reminder.prayerName)}
                    disabled={!notificationsEnabled}
                    className="flex items-center gap-1"
                  >
                    <TestTube className="h-3 w-3" />
                    Test
                  </Button>
                  
                  <Switch
                    checked={reminder.isEnabled}
                    onCheckedChange={(checked) => handleToggleReminder(reminder.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Reminder Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Set reminders 5-10 minutes before prayer time</li>
              <li>• Test notifications to ensure they're working</li>
              <li>• Adjust times based on your local prayer schedule</li>
              <li>• Keep your device volume on to hear notification sounds</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                reminders.forEach(reminder => {
                  onUpdateReminder(reminder.id, { isEnabled: true })
                })
                toast.success('All reminders enabled')
              }}
            >
              Enable All
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                reminders.forEach(reminder => {
                  onUpdateReminder(reminder.id, { isEnabled: false })
                })
                toast.success('All reminders disabled')
              }}
            >
              Disable All
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                reminders.forEach(reminder => {
                  const defaultTime = PRAYER_TIMES[reminder.prayerName as keyof typeof PRAYER_TIMES]
                  if (defaultTime) {
                    onUpdateReminder(reminder.id, { reminderTime: defaultTime })
                  }
                })
                toast.success('Reset to default times')
              }}
            >
              Reset Times
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}