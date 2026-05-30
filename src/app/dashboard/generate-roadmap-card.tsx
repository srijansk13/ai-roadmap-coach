'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export function GenerateRoadmapCard() {
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/roadmaps/generate', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      if (data.success) {
        router.push('/dashboard/roadmaps')
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to generate roadmap. Please try again or talk to coach.')
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-primary/20 p-8 rounded-2xl text-center space-y-6 shadow-xl relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-50px] left-[-50px] w-[150px] h-[150px] bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Your Profile is Ready</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We have everything we need to build your personalized Duolingo-style progression path.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:brightness-110 disabled:opacity-70 transition-all shadow-[0_0_24px_rgba(59,130,246,0.3)]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate My Roadmap
              </>
            )}
          </button>
          
          <Link
            href="/dashboard/coach"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground px-6 py-3.5 rounded-xl font-medium transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Talk to Coach First
          </Link>
        </div>
      </div>
    </div>
  )
}
