'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, RefreshCw, CheckCircle2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PollerState {
  phase: 'idle' | 'generating' | 'ready' | 'error' | 'complete'
  currentWeekStart: number
  currentWeekEnd: number
  message: string
  error: string | null
}

export default function RoadmapChunkPoller({ roadmap }: { roadmap: any }) {
  const router = useRouter()
  const isRunning = useRef(false) // ref prevents stale-closure issues in strict mode
  const [state, setState] = useState<PollerState>({
    phase: 'idle',
    currentWeekStart: (roadmap.generated_weeks_count ?? 0) + 1,
    currentWeekEnd: Math.min((roadmap.generated_weeks_count ?? 0) + 2, roadmap.total_weeks ?? 8),
    message: '',
    error: null
  })

  const [retryKey, setRetryKey] = useState(0)
  const [loadingTextIndex, setLoadingTextIndex] = useState(0)

  const loadingTexts = [
    'Forging your first two worlds...',
    'Designing missions...',
    'Attaching verified resources...',
    'Preparing boss battles...'
  ]

  const totalWeeks: number = roadmap.total_weeks ?? 8
  const initialGenerated: number = roadmap.generated_weeks_count ?? 0

  useEffect(() => {
    // Don't run if roadmap is already fully generated
    if (['active', 'completed', 'archived'].includes(roadmap.status)) return
    // Prevent double execution (React StrictMode mounts twice)
    if (isRunning.current) return
    isRunning.current = true

    const generateAllRemainingChunks = async () => {
      let currentGenerated = initialGenerated

      while (currentGenerated < totalWeeks) {
        const weekStart = currentGenerated + 1
        const weekEnd = Math.min(currentGenerated + 2, totalWeeks)

        setState(prev => ({
          ...prev,
          phase: 'generating',
          currentWeekStart: weekStart,
          currentWeekEnd: weekEnd,
          message: `Generating Week ${weekStart}–${weekEnd}...`,
          error: null
        }))

        try {
          const res = await fetch('/api/roadmaps/generate-chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roadmapId: roadmap.id })
          })

          const data = await res.json()

          if (!res.ok || data.error) {
            if (res.status === 409 && data.isGenerating) {
              // It's actively generating on another process. We wait 5 seconds and check again.
              await new Promise(resolve => setTimeout(resolve, 5000))
              router.refresh()
              continue // Retry the same chunk
            }
            
            setState(prev => ({
              ...prev,
              phase: 'error',
              error: data.error || `Failed to generate Week ${weekStart}–${weekEnd}`
            }))
            isRunning.current = false
            return
          }

          currentGenerated = data.weeksGenerated ?? weekEnd

          setState(prev => ({
            ...prev,
            phase: 'ready',
            currentWeekStart: weekStart,
            currentWeekEnd: weekEnd,
            message: `Week ${weekStart}–${weekEnd} ready!`
          }))

          // Refresh server component so new sections appear in the tree
          router.refresh()

          // Brief pause before next chunk so user sees the "ready" state
          await new Promise(resolve => setTimeout(resolve, 1800))

        } catch (err) {
          setState(prev => ({
            ...prev,
            phase: 'error',
            error: `Network error while generating Week ${weekStart}–${weekEnd}`
          }))
          isRunning.current = false
          return
        }
      }

      // All weeks done
      const durationLabel = totalWeeks % 4 === 0
        ? `${totalWeeks / 4}-Month`
        : `${totalWeeks}-Week`
      setState(prev => ({
        ...prev,
        phase: 'complete',
        message: `All worlds generated! Your full ${durationLabel} journey is ready.`
      }))
      router.refresh()
      isRunning.current = false
    }

    generateAllRemainingChunks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey])

  useEffect(() => {
    if (state.phase === 'generating') {
      const interval = setInterval(() => {
        setLoadingTextIndex(i => (i + 1) % loadingTexts.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [state.phase])

  const handleRetry = () => {
    isRunning.current = false
    setState(prev => ({
      ...prev,
      phase: 'idle',
      error: null,
      currentWeekStart: initialGenerated + 1,
      currentWeekEnd: Math.min(initialGenerated + 2, totalWeeks),
    }))
    setRetryKey(k => k + 1) // increments retryKey → triggers useEffect again
  }

  // Hide when fully generated
  if (roadmap.status === 'active' || roadmap.status === 'completed' || roadmap.status === 'archived') {
    return null
  }

  const { phase, currentWeekStart, currentWeekEnd, message, error } = state

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border shadow-lg"
        style={{
          borderColor: phase === 'error' ? 'rgba(239,68,68,0.3)' : phase === 'ready' || phase === 'complete' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)',
          background: phase === 'error' ? 'rgba(239,68,68,0.05)' : phase === 'ready' || phase === 'complete' ? 'rgba(16,185,129,0.05)' : 'rgba(99,102,241,0.05)'
        }}
      >
        <div className="p-4 flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {phase === 'error' ? (
              <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
            ) : phase === 'ready' || phase === 'complete' ? (
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              {phase === 'error' ? 'Generation Paused' :
               phase === 'complete' ? '🎉 All Worlds Ready!' :
               phase === 'ready' ? `✅ Week ${currentWeekStart}–${currentWeekEnd} Ready!` :
               `Currently generating: Week ${currentWeekStart}–${currentWeekEnd}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {error ?? message ?? `Your next worlds are being personalized by AI.`}
            </p>
            
            {phase !== 'complete' && (
              <p className="text-xs font-semibold text-primary/80 mt-1">
                Weeks generated: {initialGenerated} / {totalWeeks}
              </p>
            )}

            {/* Week dots progress */}
            {phase !== 'error' && (
              <div className="flex gap-1 mt-2">
                {Array.from({ length: totalWeeks }).map((_, i) => {
                  const weekNum = i + 1
                  const isGenerated = weekNum <= (initialGenerated + (phase === 'complete' ? totalWeeks : currentWeekEnd - 1))
                  const isCurrent = weekNum === currentWeekStart || weekNum === currentWeekEnd
                  return (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isGenerated ? 'bg-emerald-500 flex-1' :
                        isCurrent && phase === 'generating' ? 'bg-indigo-400 animate-pulse flex-1' :
                        'bg-secondary flex-1'
                      }`}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {phase === 'error' && (
          <div className="px-4 pb-4">
            {roadmap.last_generation_error && (
              <div className="mb-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-[11px] text-red-400 font-mono">
                Error: {roadmap.last_generation_error}
              </div>
            )}
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Generation
            </button>
          </div>
        )}

        {phase === 'generating' && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              <span>{loadingTexts[loadingTextIndex]}</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
