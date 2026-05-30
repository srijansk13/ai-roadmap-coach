'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function normalize(msgs: any[]): Message[] {
  return msgs
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      let content = ''
      if (typeof m.content === 'string') {
        content = m.content
      } else if (Array.isArray(m.content)) {
        content = m.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      } else if (m.parts && Array.isArray(m.parts)) {
        content = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      }
      return { id: m.id ?? String(Date.now() + Math.random()), role: m.role, content }
    })
    .filter((m) => m.content.trim() !== '')
}

export default function ChatInterface({
  chatId,
  initialMessages = [],
}: {
  chatId: string
  initialMessages?: any[]
}) {
  const [messages, setMessages] = useState<Message[]>(normalize(initialMessages))
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Track which message IDs we've already added to avoid duplicates
  const addedIds = useRef(new Set(normalize(initialMessages).map((m) => m.id)))

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setError(null)

    // Add user message to UI immediately
    const userId = String(Date.now())
    const userMsg: Message = { id: userId, role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    addedIds.current.add(userId)
    setInput('')
    setIsLoading(true)

    try {
      // Build message list to send — all current messages plus the new user one
      const toSend = [...messages, userMsg].map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, messages: toSend }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error ${res.status}`)
      }

      let assistantContent = data.content ?? ''
      if (typeof assistantContent !== 'string') {
        if (Array.isArray(assistantContent)) {
          assistantContent = assistantContent.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
        } else if (assistantContent.parts && Array.isArray(assistantContent.parts)) {
          assistantContent = assistantContent.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
        } else {
          assistantContent = String(assistantContent)
        }
      }

      // Append the assistant reply
      const assistantId = String(Date.now() + 1)
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: assistantContent,
      }
      addedIds.current.add(assistantId)
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      console.error('[Chat] Error:', err.message)
      setError(err.message || 'Something went wrong. Please try again.')
      // Remove the optimistically added user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userId))
      setInput(trimmed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4 relative z-10">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-md border border-border p-4 rounded-t-2xl flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">AI Coach</h2>
          <p className="text-sm text-muted-foreground">Strategic Career &amp; Skill Planner</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-card/30 backdrop-blur-sm border-x border-border p-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Bot className="w-12 h-12 text-primary" />
            <p>
              Your professional coach is ready.
              <br />
              What goal are we tackling today?
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-none shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-secondary text-secondary-foreground rounded-tl-none border border-border/50'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-[14px]">{m.content}</div>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1 border border-border">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator — shown below messages while waiting */}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-none px-5 py-3 border border-border/50 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="bg-card/50 backdrop-blur-md border border-border p-4 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Discuss your goals or ask for a roadmap..."
            disabled={isLoading}
            className="w-full bg-background border border-border rounded-xl py-4 pl-4 pr-14 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
