"use client"

import { useCallback, useEffect, useRef } from "react"
import type { ManualCropRect } from "@/lib/label-profiles"

const MIN_RECT_SIZE = 0.04

type ResizeHandle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se"

interface PointerPoint {
  x: number
  y: number
}

interface InteractionState {
  mode: "move" | "create" | "resize"
  handle?: ResizeHandle
  pointerId: number
  capturedElement: HTMLElement | null
  startPoint: PointerPoint
  startRect: ManualCropRect
}

interface ManualCropEditorProps {
  imageHeight: number
  imageUrl: string
  imageWidth: number
  onChange: (nextRect: ManualCropRect) => void
  value: ManualCropRect
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeUiRect(rect: ManualCropRect) {
  const x = clamp(rect.x, 0, 1 - MIN_RECT_SIZE)
  const y = clamp(rect.y, 0, 1 - MIN_RECT_SIZE)
  const width = clamp(rect.width, MIN_RECT_SIZE, 1 - x)
  const height = clamp(rect.height, MIN_RECT_SIZE, 1 - y)

  return { x, y, width, height }
}

function getSelectionStyle(rect: ManualCropRect) {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  }
}

export function ManualCropEditor({
  imageHeight,
  imageUrl,
  imageWidth,
  onChange,
  value,
}: ManualCropEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const interactionRef = useRef<InteractionState | null>(null)
  const cleanupInteractionRef = useRef<(() => void) | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const getPointerPoint = useCallback((clientX: number, clientY: number): PointerPoint | null => {
    const container = containerRef.current
    if (!container) {
      return null
    }

    const bounds = container.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) {
      return null
    }

    return {
      x: clamp((clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((clientY - bounds.top) / bounds.height, 0, 1),
    }
  }, [])

  const stopInteraction = useCallback((pointerId?: number) => {
    const interaction = interactionRef.current
    if (pointerId !== undefined && interaction?.pointerId !== pointerId) {
      return
    }

    if (interaction?.capturedElement) {
      try {
        if (interaction.capturedElement.hasPointerCapture?.(interaction.pointerId)) {
          interaction.capturedElement.releasePointerCapture(interaction.pointerId)
        }
      } catch {
        // Some mobile browsers throw if capture was already released.
      }
    }

    interactionRef.current = null
    cleanupInteractionRef.current?.()
    cleanupInteractionRef.current = null
  }, [])

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const interaction = interactionRef.current
      if (!interaction) {
        return
      }

      if (event.pointerId !== interaction.pointerId) {
        return
      }

      event.preventDefault()

      const point = getPointerPoint(event.clientX, event.clientY)
      if (!point) {
        return
      }

      const deltaX = point.x - interaction.startPoint.x
      const deltaY = point.y - interaction.startPoint.y

      if (interaction.mode === "create") {
        const nextRect = normalizeUiRect({
          x: Math.min(interaction.startPoint.x, point.x),
          y: Math.min(interaction.startPoint.y, point.y),
          width: Math.abs(deltaX),
          height: Math.abs(deltaY),
        })

        onChangeRef.current(nextRect)
        return
      }

      if (interaction.mode === "move") {
        const nextRect = normalizeUiRect({
          ...interaction.startRect,
          x: clamp(interaction.startRect.x + deltaX, 0, 1 - interaction.startRect.width),
          y: clamp(interaction.startRect.y + deltaY, 0, 1 - interaction.startRect.height),
        })

        onChangeRef.current(nextRect)
        return
      }

      if (interaction.mode === "resize" && interaction.handle) {
        let left = interaction.startRect.x
        let top = interaction.startRect.y
        let right = interaction.startRect.x + interaction.startRect.width
        let bottom = interaction.startRect.y + interaction.startRect.height

        if (interaction.handle.includes("n")) {
          top = clamp(point.y, 0, bottom - MIN_RECT_SIZE)
        }

        if (interaction.handle.includes("s")) {
          bottom = clamp(point.y, top + MIN_RECT_SIZE, 1)
        }

        if (interaction.handle.includes("w")) {
          left = clamp(point.x, 0, right - MIN_RECT_SIZE)
        }

        if (interaction.handle.includes("e")) {
          right = clamp(point.x, left + MIN_RECT_SIZE, 1)
        }

        onChangeRef.current({
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        })
      }
    },
    [getPointerPoint],
  )

  const handlePointerUp = useCallback((event: PointerEvent) => {
    stopInteraction(event.pointerId)
  }, [stopInteraction])

  const startInteraction = useCallback(
    (interaction: InteractionState) => {
      stopInteraction()

      const controller = new AbortController()
      interactionRef.current = interaction
      cleanupInteractionRef.current = () => {
        controller.abort()
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("pointercancel", handlePointerUp)
      }

      window.addEventListener("pointermove", handlePointerMove, {
        passive: false,
        signal: controller.signal,
      })
      window.addEventListener("pointerup", handlePointerUp, { signal: controller.signal })
      window.addEventListener("pointercancel", handlePointerUp, { signal: controller.signal })
    },
    [handlePointerMove, handlePointerUp, stopInteraction],
  )

  useEffect(() => () => stopInteraction(), [stopInteraction])

  const getCapturedElement = (pointerId: number) => {
    const element = containerRef.current
    if (!element) {
      return null
    }

    try {
      element.setPointerCapture?.(pointerId)
    } catch {
      // Pointer capture is a best-effort guard for touch drags.
    }

    return element
  }

  const isPrimaryPointerActivation = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      return event.button === 0
    }

    return event.isPrimary !== false
  }

  const beginCreate = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPrimaryPointerActivation(event)) {
      return
    }

    const point = getPointerPoint(event.clientX, event.clientY)
    if (!point) {
      return
    }

    event.preventDefault()
    startInteraction({
      mode: "create",
      pointerId: event.pointerId,
      capturedElement: getCapturedElement(event.pointerId),
      startPoint: point,
      startRect: value,
    })
  }

  const beginMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPrimaryPointerActivation(event)) {
      return
    }

    const point = getPointerPoint(event.clientX, event.clientY)
    if (!point) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    startInteraction({
      mode: "move",
      pointerId: event.pointerId,
      capturedElement: getCapturedElement(event.pointerId),
      startPoint: point,
      startRect: value,
    })
  }

  const beginResize =
    (handle: ResizeHandle) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPrimaryPointerActivation(event)) {
        return
      }

      const point = getPointerPoint(event.clientX, event.clientY)
      if (!point) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      startInteraction({
        mode: "resize",
        handle,
        pointerId: event.pointerId,
        capturedElement: getCapturedElement(event.pointerId),
        startPoint: point,
        startRect: value,
      })
    }

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_24px_64px_-48px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-5">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_22px_48px_-36px_rgba(15,23,42,0.45)] select-none touch-none"
        style={{ aspectRatio: `${imageWidth} / ${imageHeight}`, touchAction: "none" }}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={beginCreate}
      >
        <img src={imageUrl} alt="Aperçu du PDF source" className="block h-full w-full object-contain" draggable={false} />

        <div
          className="absolute border-2 border-sky-500 bg-sky-400/10 shadow-[0_0_0_9999px_rgba(12,18,32,0.5)]"
          style={getSelectionStyle(value)}
          onPointerDown={beginMove}
        >
          <div className="absolute left-2 top-2 rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Zone conservée
          </div>

          <div
            className="absolute left-0 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("nw")}
          />
          <div
            className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("n")}
          />
          <div
            className="absolute right-0 top-0 h-6 w-6 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("ne")}
          />
          <div
            className="absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("e")}
          />
          <div
            className="absolute right-0 bottom-0 h-6 w-6 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("se")}
          />
          <div
            className="absolute left-1/2 bottom-0 h-6 w-6 -translate-x-1/2 translate-y-1/2 cursor-ns-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("s")}
          />
          <div
            className="absolute left-0 bottom-0 h-6 w-6 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("sw")}
          />
          <div
            className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-sky-600 shadow-sm sm:h-4 sm:w-4"
            onPointerDown={beginResize("w")}
          />
        </div>
      </div>
    </div>
  )
}
