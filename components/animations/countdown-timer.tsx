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

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])

  if (!mounted) {
    return (
      <div className={cn("flex gap-2 md:gap-3", className)}>
        {["J", "H", "M", "S"].map((label) => (
          <div
            key={label}
            className="flex flex-col items-center"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-3 min-w-[50px] md:min-w-[70px] border border-white/20">
              <span className="text-xl md:text-3xl font-bold text-white tabular-nums">
                00
              </span>
            </div>
            <span className="text-[10px] md:text-xs text-white/70 mt-1 uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const timeUnits = [
    { value: timeLeft.days, label: "J" },
    { value: timeLeft.hours, label: "H" },
    { value: timeLeft.minutes, label: "M" },
    { value: timeLeft.seconds, label: "S" },
  ]

  return (
    <div className={cn("flex gap-2 md:gap-3", className)}>
      {timeUnits.map(({ value, label }) => (
        <div
          key={label}
          className="flex flex-col items-center"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-3 min-w-[50px] md:min-w-[70px] border border-white/20 shadow-lg">
            <span className="text-xl md:text-3xl font-bold text-white tabular-nums block text-center">
              {value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-white/70 mt-1 uppercase tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
