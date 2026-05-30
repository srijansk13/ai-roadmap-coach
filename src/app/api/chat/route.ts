import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GEMINI_MODEL } from '@/lib/ai-config'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { chatId, coachMode = 'Career Coach', messages: rawMessages = [] } = body

    console.log('[AI Coach] chatId:', chatId, '| messages:', rawMessages?.length)

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user profile for context
    const [{ data: profile }, { data: roadmap }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('roadmaps')
        .select('title, duration_days, total_weeks, generated_weeks_count')
        .eq('user_id', user.id)
        .in('status', ['active', 'partially_ready', 'generating'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ])

    const userContext = [
      `Name: ${profile?.full_name || 'Not set'}`,
      `Primary Goal: ${profile?.primary_goal || 'Not set'}`,
      `Target Role: ${profile?.target_role || 'Not set'}`,
      `Current Level: ${profile?.current_level || 'Not set'}`,
      `Target Timeline: ${profile?.target_timeline || 'Not set'}`,
      `Hours per Week: ${profile?.available_hours || 'Not set'}`,
      `Learning Style: ${profile?.learning_style || 'Not set'}`,
      `Roadmap Intensity: ${profile?.roadmap_intensity || 'Not set'}`,
      `Current XP: ${profile?.total_xp || 0}`,
      `Current Streak: ${profile?.current_streak || 0} days`,
      `Global Level: ${profile?.global_level || 1}`,
      `Tasks Completed: ${profile?.tasks_completed || 0}`,
    ].join('\n')

    const roadmapContext = roadmap
      ? `Active Roadmap: ${roadmap.title} | Duration: ${roadmap.duration_days} days | Total Weeks: ${roadmap.total_weeks} | Generated: ${roadmap.generated_weeks_count} weeks`
      : 'No active roadmap.'

    const systemPrompt = `You are an elite, highly professional ${coachMode} for SkillQuest AI — a premium AI-powered personal growth operating system.

Your sole purpose is to strategize career paths, create learning roadmaps, and facilitate the user's skill and career growth. You are NOT a general assistant, therapist, or casual chatbot.

CRITICAL BEHAVIORAL RULES:
1. NEVER engage in casual conversation, jokes, roleplay, small talk, or off-topic discussions.
2. If the user says "Hi" or "Hello", immediately acknowledge them professionally and ask one specific, useful question about their career goals.
3. Ask ONLY ONE follow-up question at a time. Never overwhelm the user with multiple questions.
4. When users provide career information (skills, goals, timelines), acknowledge it professionally, then ask the most logical next question.
5. If a user asks something off-topic or tries to use you as a general chatbot, politely redirect them to their career goals.
6. Always use the update_profile tool when users mention new skills, roles, or timelines.
7. Keep responses concise, professional, and action-oriented. No fluff.
8. Format responses clearly with bullet points or numbered lists when giving advice or steps.
9. Never start a response with "Sure!", "Great!", "Absolutely!", or similar filler words.
10. EXTREMELY IMPORTANT: You MUST answer professional questions about the user's roadmap (e.g., "What should I do on Day 1?", "Explain my current roadmap", "How should I complete this level?"). Do not ignore valid professional questions. Reject ONLY casual/off-topic messages.

YOUR SPECIALIZATIONS:
- Software engineering career paths (Frontend, Backend, Full Stack, Mobile, DevOps, Cloud)
- Data Science, Machine Learning, and AI engineering roadmaps
- DSA preparation for coding interviews (FAANG-level)
- Internship and job placement strategies
- System design for senior roles
- Freelancing and startup tech strategies

USER CONTEXT (use this to personalize every response):
${userContext}

ROADMAP CONTEXT:
${roadmapContext}

When generating advice or roadmaps, always factor in the user's timeline, hours per week, and current level. Be realistic but ambitious.`

    // Build plain text conversation history from messages
    // Each message can be {role, content} or {role, parts:[{type:'text', text:'...'}]}
    const getText = (m: any): string => {
      if (typeof m.content === 'string') return m.content
      if (Array.isArray(m.content)) {
        return m.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      }
      if (Array.isArray(m.parts)) {
        return m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      }
      return ''
    }

    // Build messages array for generateText (CoreMessage format)
    const coreMessages = rawMessages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: getText(m),
      }))
      .filter((m: any) => m.content.trim() !== '')

    if (coreMessages.length === 0) {
      return NextResponse.json({ error: 'No valid messages to process' }, { status: 400 })
    }

    // Generate response (no tools — avoids "empty output" crash when model calls a tool)
    const { text } = await generateText({
      model: google(GEMINI_MODEL),
      system: systemPrompt,
      messages: coreMessages,
    })

    // Persist assistant message
    if (chatId && text) {
      // Persist user message first (last message in array)
      const lastUserMsg = [...rawMessages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        const userText = getText(lastUserMsg)
        if (userText) {
          await supabase.from('chat_messages').insert({
            chat_id: chatId,
            role: 'user',
            content: userText,
          }).then(({ error }) => {
            if (error) console.error('[Chat API] Failed to save user message:', error.message)
          })
        }
      }

      await supabase.from('chat_messages').insert({
        chat_id: chatId,
        role: 'assistant',
        content: text,
      }).then(({ error }) => {
        if (error) console.error('[Chat API] Failed to save assistant message:', error.message)
      })
    }

    return NextResponse.json({ role: 'assistant', content: text })

  } catch (err: any) {
    console.error('[AI Coach] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
