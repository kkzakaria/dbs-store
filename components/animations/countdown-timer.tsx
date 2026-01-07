"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  targetDate: Date
  className?: string
  onComplete?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({
  targetDate,
  className,
  onComplete,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        onComplete?.()
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])


  if (!mounted) {
    return (
      <div className={cn("flex gap-3 md:gap-4", className)}>
        {["J", "H", "M", "S"].map((label) => (
          <div
            key={label}
            className="flex flex-col items-center"
          >
            <div className="bg-[#f8f9fa] dark:bg-muted/20 rounded-[20px] p-3 md:p-4 min-w-[60px] md:min-w-[80px] border border-border/40 shadow-google-sm">
              <span className="text-2xl md:text-3xl font-display font-bold text-foreground tabular-nums">
                00
              </span>
            </div>
            <span className="text-[10px] md:text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Jours" },
    { value: timeLeft.hours, label: "Heures" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ]

  return (
    <div className={cn("flex gap-3 md:gap-4", className)}>
      {timeUnits.map(({ value, label }) => (
        <div
          key={label}
          className="flex flex-col items-center"
        >
          <div className="bg-[#f8f9fa] dark:bg-muted/20 rounded-[20px] p-3 md:p-4 min-w-[60px] md:min-w-[80px] border border-border/40 shadow-google-sm">
            <span className="text-2xl md:text-3xl font-display font-bold text-foreground tabular-nums block text-center">
              {value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
