"use client"

import { useEffect } from "react"
import { type ClientAnalyticsPayload, trackClientEvent } from "@/lib/client-analytics"

interface AnalyticsEventOnMountProps {
  data?: ClientAnalyticsPayload
  eventName: string
}

export function AnalyticsEventOnMount({ data, eventName }: AnalyticsEventOnMountProps) {
  useEffect(() => {
    trackClientEvent(eventName, data)
  }, [data, eventName])

  return null
}
