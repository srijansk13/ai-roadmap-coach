import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { GEMINI_MODEL } from '@/lib/ai-config'
import { resolveSingleResource } from '@/lib/resource-resolver'

export const maxDuration = 60;

const sectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  levels: z.array(z.object({
    title: z.string(),
    objective: z.string().describe("Story-style description. MUST END with 'Why this matters: [Reason]'"),
    motivational_message: z.string(),
    practice_challenge: z.string(),
    is_boss_level: z.boolean(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'boss']),
    resources: z.array(z.object({
      title: z.string(),
      topic_intent: z.string().describe('The primary topic or skill to learn, e.g., "React Hooks", "CSS Flexbox"'),
      type: z.enum(['docs', 'video', 'practice'])
    })).length(3),
    tasks: z.array(z.object({
      title: z.string(),
      type: z.enum(['learn', 'practice', 'build', 'apply', 'review', 'challenge', 'portfolio', 'interview'])
    })).min(3).max(8)
  })).min(5).max(7)
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { roadmapId } = await req.json()
  if (!roadmapId) return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })

  const { data: roadmap } = await supabase.from('roadmaps').select('*').eq('id', roadmapId).single()
  if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })

  // Guard: only generate if there are remaining weeks
  const currentGenerated: number = roadmap.generated_weeks_count ?? 0
  const totalWeeks: number = roadmap.total_weeks ?? 8

  if (currentGenerated >= totalWeeks || ['active', 'completed', 'archived'].includes(roadmap.status)) {
    return NextResponse.json({ success: true, weeksGenerated: currentGenerated, alreadyDone: true })
  }
  
  // If roadmap previously failed, reset it so we can retry
  if (roadmap.status === 'failed') {
    await supabase.from('roadmaps').update({
      status: 'partially_ready',
      last_generation_error: null,
    }).eq('id', roadmapId)
  }

  // Prevent duplicate concurrent generation, but allow retry if stuck for > 2 minutes
  if (roadmap.status === 'generating') {
    if (roadmap.generation_started_at) {
      const startedAt = new Date(roadmap.generation_started_at).getTime()
      const now = Date.now()
      if (now - startedAt < 2 * 60 * 1000) {
        return NextResponse.json({ error: 'Generation already in progress', isGenerating: true }, { status: 409 })
      }
      // If it's been more than 2 minutes, we assume it's stuck and proceed
    } else {
      return NextResponse.json({ error: 'Generation already in progress', isGenerating: true }, { status: 409 })
    }
  }

  const startWeek = currentGenerated + 1
  const endWeek = Math.min(startWeek + 1, totalWeeks)
  const numWeeksThisChunk = endWeek - startWeek + 1
  const isFinalChunk = endWeek >= totalWeeks

  // Mark status as generating
  await supabase.from('roadmaps').update({ 
    status: 'generating',
    current_generating_chunk: startWeek,
    generation_started_at: new Date().toISOString()
  }).eq('id', roadmapId)

  const [{ data: profile }, { data: skills }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('skills').select('*').eq('user_id', user.id)
  ])

  // Full-stack week curriculum guide for AI
  const weekCurriculum: Record<number, string> = {
    1: 'Dev Environment Setup + HTML Fundamentals (VS Code, Node, Git, semantic HTML, basic CSS)',
    2: 'CSS Mastery (Flexbox, Grid, animations, responsive design, building real UI sections)',
    3: 'JavaScript Fundamentals (variables, functions, DOM manipulation, events)',
    4: 'Async JS + APIs (Promises, async/await, fetch, mini projects with real APIs)',
    5: 'React Basics (components, props, state, hooks: useState, useEffect)',
    6: 'Backend with Node.js + Express (REST APIs, middleware, routing, JSON responses)',
    7: 'Database + Auth (Supabase/PostgreSQL, SQL basics, authentication, JWT)',
    8: 'Full-Stack Project + Career Prep (deploy full-stack app, resume, GitHub, LinkedIn, interview prep)',
  }

  const weekGuides = Array.from({ length: numWeeksThisChunk }, (_, i) => {
    const weekNum = startWeek + i
    return `Week ${weekNum}: ${weekCurriculum[weekNum] || 'Advanced topics for ' + profile?.target_role}`
  }).join('\n')

  const systemPrompt = `
You are the Roadmap Generator Engine for SkillQuest AI. Generate EXACTLY ${numWeeksThisChunk} weekly section(s): Week ${startWeek} to Week ${endWeek}.

CURRICULUM FOR THESE WEEKS:
${weekGuides}

FORMATTING RULES (follow these exactly):
- Each week must have 5-7 daily levels. The LAST level of each week is a BOSS level (recap + massive mini-project).
- Mix up the day types (Setup Day, Exploration Day, Mini-Project Day, Challenge Day, Review Day, Portfolio Day, Interview Prep Day).
- level title: A SHORT, exciting mission name (e.g. "Construct Your Developer Basecamp"). Action verb first.
- objective: A story-style description of what the developer will accomplish. **MUST** end with exactly "Why this matters: [Reason]".
- tasks: 3-8 project-driven quests that feel like Duolingo missions or real-world tickets. No theory lessons.
  BAD: "Learn Flexbox", "Practice CSS Selectors", "Learn HTML Structure"
  GOOD: "Build a Netflix-style navigation bar", "Build a Battle-Ready Landing Page", "Clone a LinkedIn profile header"
- task type: Choose accurately from ['learn', 'practice', 'build', 'apply', 'review', 'challenge', 'portfolio', 'interview'].
- practice_challenge: One concrete hands-on mini-project the user builds after finishing tasks.
- motivational_message: A punchy completion message. E.g. "You just built software that people can actually use. You are officially a developer."
- resources: EXACTLY 3 resources for each level:
  1) A 'docs' type resource (provide topic_intent, e.g. "React Hooks")
  2) A 'video' type resource (provide topic_intent)
  3) A 'practice' type resource (provide topic_intent)
  Do NOT provide raw URLs. Only provide title, topic_intent, and type.
- Difficulty: ${profile?.current_level}. Target: ${profile?.target_role}.
- NEVER generate GitHub proof requirements for beginner levels (Weeks 1-4). Text or URL proof is sufficient.
`

  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 50000);

    const { object } = await generateObject({
      model: google(GEMINI_MODEL),
      system: systemPrompt,
      prompt: `Generate Week ${startWeek} to Week ${endWeek} missions for: Goal=${profile?.primary_goal}, Role=${profile?.target_role}, Level=${profile?.current_level}, Existing Skills=${skills?.map(s => s.skill_name).join(',') || 'None'}. Make tasks feel like quests, not syllabus items.`,
      schema: z.object({
        sections: z.array(sectionSchema).length(numWeeksThisChunk)
      }),
      abortSignal: abortController.signal
    })
    
    clearTimeout(timeoutId);

    let sectionIndex = startWeek;

    // Fetch highest existing level_number so we continue numbering correctly
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
        
        const currentLevelIndex = globalLevelIndex++;
        const status = currentLevelIndex === 1 ? 'unlocked' : 'locked';

        const { data: lData } = await supabase.from('roadmap_levels').insert({
          section_id: sData.id,
          level_number: currentLevelIndex,
          title: level.title,
          objective: level.objective,
          difficulty: level.difficulty,
          xp_reward: xpReward,
          is_boss_level: level.is_boss_level,
          status,
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
    if (error.name === 'AbortError') {
      console.error('AI generation timed out (50s limit).');
      await supabase.from('roadmaps').update({ 
        status: 'failed',
        last_generation_error: 'AI generation timed out. Please retry.'
      }).eq('id', roadmapId)
      return NextResponse.json({ error: 'Generation timed out. Please retry.', retryable: true }, { status: 504 })
    }

    console.error('Error generating chunk:', error)
    await supabase.from('roadmaps').update({ 
      status: 'failed',
      last_generation_error: error.message || 'Unknown error occurred during generation'
    }).eq('id', roadmapId)
    return NextResponse.json({ error: 'Failed to generate next chunk' }, { status: 500 })
  }
}
