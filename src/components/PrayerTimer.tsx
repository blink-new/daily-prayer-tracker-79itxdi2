import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface PrayerTimerProps {
  prayerName: string
  onComplete: (startTime: Date, endTime: Date, duration: number) => void
  onCancel: () => void
}

export default function PrayerTimer({ prayerName, onComplete, onCancel }: PrayerTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && !isPaused && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime())
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isPaused, startTime])

  const handleStart = () => {
    const now = new Date()
    setStartTime(now)
    setIsRunning(true)
    setIsPaused(false)
    setElapsedTime(0)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    if (startTime) {
      const endTime = new Date()
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // in minutes
      onComplete(startTime, endTime, duration)
    }
    resetTimer()
  }

  const handleCancel = () => {
    resetTimer()
    onCancel()
  }

  const resetTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    setStartTime(null)
    setElapsedTime(0)
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          {prayerName} Prayer Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-primary mb-2">
            {formatTime(elapsedTime)}
          </div>
          {startTime && (
            <div className="text-sm text-muted-foreground">
              Started at {format(startTime, 'h:mm:ss a')}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          {!isRunning && (
            <Badge variant="secondary">Ready to start</Badge>
          )}
          {isRunning && !isPaused && (
            <Badge className="bg-green-500 text-white">In Progress</Badge>
          )}
          {isRunning && isPaused && (
            <Badge variant="outline">Paused</Badge>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <>
              <Button onClick={handleStart} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Prayer
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handlePause}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                onClick={handleStop}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Square className="h-4 w-4" />
                Complete
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Tips */}
        <div className="text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Prayer Tips:</p>
          <p>Take your time and focus on your connection with Allah. Quality over speed.</p>
        </div>
      </CardContent>
    </Card>
  )
}