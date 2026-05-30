import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Fetch context
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const defaultTitle = profile?.primary_goal 
    ? `${profile.primary_goal} Quest` 
    : 'Your Developer Quest'

  // Archive old roadmaps
  await supabase.from('roadmaps').update({ status: 'archived' }).eq('user_id', user.id)

  const { count } = await supabase.from('roadmaps').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const newVersion = `V${(count || 0) + 1}`

  // Insert Roadmap
  const { data: roadmap, error: rError } = await supabase.from('roadmaps').insert({
    user_id: user.id,
    version: newVersion,
    title: defaultTitle,
    career_goal: profile?.primary_goal || 'Unknown',
    duration_days: parseInt(profile?.target_timeline || '60') || 60,
    generated_weeks_count: 0,
    total_weeks: 8,
    status: 'partially_ready' // Allows the chunk poller to pick it up immediately
  }).select().single()

  if (rError || !roadmap) return NextResponse.json({ error: 'Roadmap creation failed' }, { status: 500 })

  return NextResponse.json({ success: true, roadmapId: roadmap.id })
}
