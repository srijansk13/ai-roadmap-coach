import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { GEMINI_MODEL } from '@/lib/ai-config'

export const maxDuration = 30;

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
      url: z.string().describe('URL or placeholder link')
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

  // Fetch context
  const [{ data: profile }, { data: skills }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('skills').select('*').eq('user_id', user.id)
  ])

  const systemPrompt = `
You are the Roadmap Generator Engine for SkillQuest AI. Generate EXACTLY 1 weekly section: Week 1.

CURRICULUM FOR WEEK 1:
Week 1: Dev Environment Setup + HTML Fundamentals (VS Code setup, Node.js, Git basics, terminal, semantic HTML, creating real pages)

FORMATTING RULES (follow these exactly):
- Each week must have 5-7 daily levels. The LAST level of each week is a BOSS level (full project/recap).
- Mix up the day types (Setup Day, Exploration Day, Mini-Project Day, Challenge Day, Review Day, Boss Battle).
- level title: A SHORT, exciting mission name (e.g. "Construct Your Developer Basecamp"). Action verb first.
- objective: A STORY-style description of what the developer accomplishes. **MUST** end with exactly "Why this matters: [Reason]".
- tasks: 3-8 project-driven quests that feel like Duolingo missions or real-world tickets. No theory lessons.
  BAD: "Learn Flexbox", "Practice CSS Selectors", "Learn HTML Structure"
  GOOD: "Build a Netflix-style navigation bar", "Build a Battle-Ready Landing Page", "Clone a LinkedIn profile header"
- task type: Choose accurately from ['learn', 'practice', 'build', 'apply', 'review', 'challenge', 'portfolio', 'interview'].
- practice_challenge: One concrete hands-on mini-project to build with only the current day's skills.
- motivational_message: A short punchy completion message. E.g. "Your first webpage exists. Tomorrow, it gets beautiful."
- resources: EXACTLY 3 links for each level:
  1) Official documentation link (e.g. MDN, React Docs)
  2) Free YouTube/video tutorial link (e.g. Traversy Media, freeCodeCamp, Kevin Powell, Web Dev Simplified)
  3) Practical free exercise or project reference link
- Difficulty: ${profile?.current_level ?? 'beginner'}. Target: ${profile?.target_role ?? 'Full Stack Developer'}.
- Week 1 levels are beginner — DO NOT require GitHub proof. Use text confirmation as proof.
`

  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    system: systemPrompt,
    prompt: `Generate Week 1 missions for: Goal=${profile?.primary_goal}, Role=${profile?.target_role}, Level=${profile?.current_level}, Existing Skills=${skills?.map(s => s.skill_name).join(',') || 'None'}. Make this feel like starting an epic developer adventure, not reading a textbook.`,
    schema: z.object({
      title: z.string().describe('The overall title of the 60-day roadmap — exciting, mission-style (e.g. "Full-Stack Internship Quest: 60-Day Sprint")'),
      sections: z.array(sectionSchema).length(1)
    }),
    abortSignal: AbortSignal.timeout(20000)
  })


  // Archive old roadmaps
  await supabase.from('roadmaps').update({ status: 'archived' }).eq('user_id', user.id)

  const { count } = await supabase.from('roadmaps').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const newVersion = `V${(count || 0) + 1}`

  // Insert Roadmap
  const { data: roadmap, error: rError } = await supabase.from('roadmaps').insert({
    user_id: user.id,
    version: newVersion,
    title: object.title,
    career_goal: profile?.primary_goal || 'Unknown',
    duration_days: parseInt(profile?.target_timeline || '60') || 60,
    generated_weeks_count: 1,
    total_weeks: 8,
    status: 'partially_ready'
  }).select().single()

  if (rError || !roadmap) return NextResponse.json({ error: 'Roadmap creation failed' }, { status: 500 })

  let sectionIndex = 1;
  let globalLevelIndex = 1;

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

      const status = globalLevelIndex === 1 ? 'unlocked' : 'locked'

      const { data: lData } = await supabase.from('roadmap_levels').insert({
        section_id: sData.id,
        level_number: globalLevelIndex++,
        title: level.title,
        objective: level.objective,
        difficulty: level.difficulty,
        xp_reward: xpReward,
        is_boss_level: level.is_boss_level,
        status,
        motivational_message: level.motivational_message,
        practice_challenge: level.practice_challenge,
        resources: level.resources
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

  return NextResponse.json({ success: true, roadmapId: roadmap.id })
}
