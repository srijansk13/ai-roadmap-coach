import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { resolveSingleResource } from '@/lib/resource-resolver'

export const maxDuration = 45;

const sectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  levels: z.array(z.object({
    title: z.string(),
    objective: z.string().describe("1-2 short sentences. MUST END with 'Why this matters: [Reason]'"),
    motivational_message: z.string(),
    practice_challenge: z.string(),
    is_boss_level: z.boolean(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'boss']),
    resources: z.array(z.object({
      title: z.string(),
      topic_intent: z.string().describe('Short primary topic intent'),
      type: z.enum(['docs', 'video', 'practice'])
    })).length(3),
    tasks: z.array(z.object({
      title: z.string(),
      type: z.enum(['learn', 'practice', 'build', 'apply', 'review', 'challenge', 'portfolio', 'interview'])
    })).min(3).max(4)
  })).min(3).max(5)
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { roadmapId } = await req.json()
  if (!roadmapId) return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })

  const { data: roadmap } = await supabase.from('roadmaps').select('*').eq('id', roadmapId).single()
  if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })

  const currentGenerated: number = roadmap.generated_weeks_count ?? 0
  const totalWeeks: number = roadmap.total_weeks ?? 8

  if (currentGenerated >= totalWeeks || ['active', 'completed', 'archived'].includes(roadmap.status)) {
    return NextResponse.json({ success: true, weeksGenerated: currentGenerated, alreadyDone: true })
  }
  
  if (roadmap.status === 'failed') {
    await supabase.from('roadmaps').update({
      status: 'partially_ready',
      last_generation_error: null,
    }).eq('id', roadmapId)
  }

  if (roadmap.status === 'generating') {
    if (roadmap.generation_started_at) {
      const startedAt = new Date(roadmap.generation_started_at).getTime()
      const now = Date.now()
      if (now - startedAt < 2 * 60 * 1000) {
        return NextResponse.json({ error: 'Generation already in progress', isGenerating: true }, { status: 409 })
      }
    } else {
      return NextResponse.json({ error: 'Generation already in progress', isGenerating: true }, { status: 409 })
    }
  }

  const startWeek = currentGenerated + 1
  const endWeek = Math.min(startWeek, totalWeeks)
  const numWeeksThisChunk = endWeek - startWeek + 1
  const isFinalChunk = endWeek >= totalWeeks

  await supabase.from('roadmaps').update({ 
    status: 'generating',
    current_generating_chunk: startWeek,
    generation_started_at: new Date().toISOString()
  }).eq('id', roadmapId)

  const [{ data: profile }, { data: skills }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('skills').select('*').eq('user_id', user.id)
  ])

  const weekCurriculum: Record<number, string> = {
    1: 'Dev Environment Setup + HTML Fundamentals',
    2: 'CSS Mastery',
    3: 'JavaScript Fundamentals',
    4: 'Async JS + APIs',
    5: 'React Basics',
    6: 'Backend with Node.js + Express',
    7: 'Database + Auth',
    8: 'Full-Stack Project + Career Prep',
  }

  const weekGuides = Array.from({ length: numWeeksThisChunk }, (_, i) => {
    const weekNum = startWeek + i
    return `Week ${weekNum}: ${weekCurriculum[weekNum] || 'Advanced topics'}`
  }).join('\n')

  const systemPrompt = `
You are the Roadmap Generator Engine for SkillQuest AI. Generate EXACTLY ${numWeeksThisChunk} weekly section(s): Week ${startWeek} to Week ${endWeek}.

CURRICULUM FOR THESE WEEKS:
${weekGuides}

FORMATTING RULES (COMPACT JSON ONLY):
- 3 to 5 levels max per week. LAST level is boss level.
- Short mission titles (e.g. "Dev Basecamp").
- objective: 1-2 short sentences. No essays. MUST end with "Why this matters: [Reason]".
- tasks: 3-4 tasks max per level. Keep titles short.
- practice_challenge: 1 sentence description.
- motivational_message: 1 short punchy sentence.
- resources: EXACTLY 3 resources. Provide title, topic_intent, type.
- Difficulty: ${profile?.current_level}. Target: ${profile?.target_role}.
`

  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Generate compact Week ${startWeek} missions for: Goal=${profile?.primary_goal}, Role=${profile?.target_role}, Level=${profile?.current_level}. NO markdown, NO huge explanations.`,
      schema: z.object({
        sections: z.array(sectionSchema).length(numWeeksThisChunk)
      }),
      temperature: 0.5,
      abortSignal: AbortSignal.timeout(25000)
    })

    let sectionIndex = startWeek;

    const { data: existingSections } = await supabase
      .from('roadmap_sections')
      .select('id')
      .eq('roadmap_id', roadmapId)
    
    let globalLevelIndex = 1
    if (existingSections && existingSections.length > 0) {
      const sectionIds = existingSections.map(s => s.id)
      const { data: existingLevels } = await supabase
        .from('roadmap_levels')
        .select('level_number')
        .in('section_id', sectionIds)
        .order('level_number', { ascending: false })
        .limit(1)
      if (existingLevels && existingLevels.length > 0) {
        globalLevelIndex = existingLevels[0].level_number + 1
      }
    }

    // Clean up any potentially duplicated section due to a mid-flight failure on retry
    if (existingSections) {
      await supabase.from('roadmap_sections').delete().eq('roadmap_id', roadmapId).eq('section_number', startWeek)
    }

    for (const section of object.sections) {
      const { data: sData } = await supabase.from('roadmap_sections').insert({
        roadmap_id: roadmap.id,
        section_number: sectionIndex++,
        title: section.title,
        description: section.description
      }).select().single()

      if (!sData) continue;

      for (const level of section.levels) {
        let xpReward = 50;
        if (level.is_boss_level) xpReward = 250;
        else if (level.title.toLowerCase().includes('portfolio') || level.title.toLowerCase().includes('interview')) xpReward = 100;
        else if (level.title.toLowerCase().includes('challenge') || level.title.toLowerCase().includes('project')) xpReward = 75;
        
        const { data: lData } = await supabase.from('roadmap_levels').insert({
          section_id: sData.id,
          level_number: globalLevelIndex++,
          title: level.title,
          objective: level.objective,
          difficulty: level.difficulty,
          xp_reward: xpReward,
          is_boss_level: level.is_boss_level,
          status: globalLevelIndex === 1 ? 'unlocked' : 'locked',
          motivational_message: level.motivational_message,
          practice_challenge: level.practice_challenge,
          resources: level.resources.map(r => {
            return resolveSingleResource(r.topic_intent, r.type as any, r.title);
          })
        }).select().single()

        if (!lData) continue;

        const tasksToInsert = level.tasks.map((task, tIdx) => {
          let proofType = 'none';
          let requiresProof = false;
          
          if (task.type === 'build' || task.type === 'apply') {
            requiresProof = true;
            proofType = level.difficulty === 'beginner' ? 'text' : (level.difficulty === 'advanced' ? 'github' : 'url')
          }

          return {
            level_id: lData.id,
            title: task.title,
            type: task.type,
            sort_order: tIdx + 1,
            requires_proof: requiresProof,
            proof_type: proofType,
            status: 'pending'
          }
        })

        if (tasksToInsert.length > 0) {
          await supabase.from('roadmap_tasks').insert(tasksToInsert)
        }
      }
    }

    await supabase.from('roadmaps').update({
      generated_weeks_count: endWeek,
      status: isFinalChunk ? 'active' : 'partially_ready',
      current_generating_chunk: null,
      last_generation_error: null
    }).eq('id', roadmapId)

    return NextResponse.json({ success: true, weeksGenerated: endWeek, isFinalChunk })
  } catch (error: any) {
    console.error('Error generating chunk:', error)
    await supabase.from('roadmaps').update({ 
      status: 'failed',
      last_generation_error: error.message || 'Unknown error occurred during generation'
    }).eq('id', roadmapId)
    return NextResponse.json({ error: error.message || 'Failed to generate next chunk' }, { status: 200 })
  }
}
