"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useHasActivePromotions() {
  const [hasPromotions, setHasPromotions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkPromotions() {
      const supabase = createClient()
      const now = new Date().toISOString()

      const { count, error } = await supabase
        .from("promotions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)

      if (!error && count && count > 0) {
        setHasPromotions(true)
      } else {
        setHasPromotions(false)
      }
      setIsLoading(false)
    }

    checkPromotions()
  }, [])

  return { hasPromotions, isLoading }
}
