import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 30;

function parseTimelineToWeeks(timeline: string): number {
  if (!timeline) return 8; // default
  
  const lower = timeline.toLowerCase();
  
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    return Math.max(1, Math.min(months * 4, 52));
  }
  
  if (lower.includes('one month') || lower.includes('1 month')) return 4;
  if (lower.includes('two month') || lower.includes('2 month')) return 8;
  if (lower.includes('three month') || lower.includes('3 month')) return 12;
  if (lower.includes('six month') || lower.includes('6 month')) return 24;

  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    return Math.max(1, Math.min(weeks, 52));
  }

  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    return Math.max(1, Math.min(Math.ceil(days / 7), 52));
  }

  if (lower.includes('year')) return 52;
  if (lower.includes('semester')) return 16;

  return 8; // fallback
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Fetch context
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Archive old roadmaps
  await supabase.from('roadmaps').update({ status: 'archived' }).eq('user_id', user.id)

  const { count } = await supabase.from('roadmaps').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const newVersion = `V${(count || 0) + 1}`

  const timelineStr = profile?.target_timeline || '2 months'
  const totalWeeks = parseTimelineToWeeks(timelineStr)
  const durationDays = totalWeeks * 7

  let timelineLabel = `${durationDays}-Day Sprint`
  if (totalWeeks % 4 === 0) {
    timelineLabel = `${totalWeeks / 4}-Month Sprint`
  } else if (totalWeeks === 8) {
    timelineLabel = `2-Month Sprint`
  }

  const title = profile?.primary_goal 
    ? `${profile.primary_goal} Quest: ${timelineLabel}` 
    : `Developer Quest: ${timelineLabel}`

  // Insert Roadmap shell
  const { data: roadmap, error: rError } = await supabase.from('roadmaps').insert({
    user_id: user.id,
    version: newVersion,
    title,
    career_goal: profile?.primary_goal || 'Unknown',
    duration_days: durationDays,
    generated_weeks_count: 0,
    total_weeks: totalWeeks,
    status: 'partially_ready'
  }).select().single()

  if (rError || !roadmap) return NextResponse.json({ error: 'Roadmap creation failed' }, { status: 500 })

  return NextResponse.json({ success: true, roadmapId: roadmap.id })
}
