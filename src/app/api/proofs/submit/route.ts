import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const levelId: string | undefined = body.levelId

  if (!levelId) {
    return NextResponse.json({ error: 'Missing levelId' }, { status: 400 })
  }

  // Mark all tasks in this level as completed
  await supabase
    .from('roadmap_tasks')
    .update({ status: 'approved' })
    .eq('level_id', levelId)

  // Mark the level itself as completed and fetch its metadata
  const { data: level } = await supabase
    .from('roadmap_levels')
    .update({ status: 'completed' })
    .eq('id', levelId)
    .select('xp_reward, section_id, level_number, is_boss_level')
    .single()

  if (!level) {
    return NextResponse.json({ error: 'Level not found' }, { status: 404 })
  }

  // Unlock the next level — first try same section, then next section's first level
  const nextLevelNumber = level.level_number + 1

  // Try same section
  const { data: sameSecNext } = await supabase
    .from('roadmap_levels')
    .update({ status: 'unlocked' })
    .eq('section_id', level.section_id)
    .eq('level_number', nextLevelNumber)
    .eq('status', 'locked')
    .select('id')

  // If same section has no next level, unlock first locked level in the next section
  if (!sameSecNext || sameSecNext.length === 0) {
    // Find the section
    const { data: currentSection } = await supabase
      .from('roadmap_sections')
      .select('roadmap_id, section_number')
      .eq('id', level.section_id)
      .single()

    if (currentSection) {
      const { data: nextSection } = await supabase
        .from('roadmap_sections')
        .select('id')
        .eq('roadmap_id', currentSection.roadmap_id)
        .eq('section_number', currentSection.section_number + 1)
        .single()

      if (nextSection) {
        // Unlock the first locked level in the next section
        const { data: firstLockedInNext } = await supabase
          .from('roadmap_levels')
          .select('id')
          .eq('section_id', nextSection.id)
          .eq('status', 'locked')
          .order('level_number', { ascending: true })
          .limit(1)
          .single()

        if (firstLockedInNext) {
          await supabase
            .from('roadmap_levels')
            .update({ status: 'unlocked' })
            .eq('id', firstLockedInNext.id)
        }
      }
    }
  }

  // Award XP and update profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let responseData: Record<string, unknown> = { success: true, levelUp: true, globalLevelUp: false, xpGained: level.xp_reward }

  if (profile) {
    const today = new Date().toISOString().split('T')[0]
    const lastActiveDay = profile.updated_at ? new Date(profile.updated_at).toISOString().split('T')[0] : ''
    const isNewDay = lastActiveDay !== today
    const newStreak = isNewDay ? profile.current_streak + 1 : profile.current_streak

    // Calculate XP multiplier based on streak
    let xpMultiplier = 1.0;
    if (newStreak >= 3) xpMultiplier = 1.2;
    if (newStreak >= 7) xpMultiplier = 1.5;
    if (newStreak >= 14) xpMultiplier = 2.0;

    const finalXpReward = Math.round(level.xp_reward * xpMultiplier);
    const newXp = profile.total_xp + finalXpReward
    const newGlobalLevel = Math.floor(newXp / 500) + 1
    const isGlobalLevelUp = newGlobalLevel > profile.global_level

    const newTasksCompleted = profile.tasks_completed + 1;

    let rankTitle = profile.rank_title
    if (isGlobalLevelUp) {
      if (newGlobalLevel >= 5)  rankTitle = 'Explorer'
      if (newGlobalLevel >= 15) rankTitle = 'Builder'
      if (newGlobalLevel >= 30) rankTitle = 'Engineer'
      if (newGlobalLevel >= 50) rankTitle = 'Architect'
      if (newGlobalLevel >= 100) rankTitle = 'Full Stack Hero'
    }

    await supabase.from('profiles').update({
      total_xp: newXp,
      global_level: newGlobalLevel,
      rank_title: rankTitle,
      tasks_completed: newTasksCompleted,
      current_streak: newStreak,
      max_streak: Math.max(profile.max_streak, newStreak),
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    // Handle Achievements
    const unlockedAchievements: string[] = [];

    const awardAchievement = async (name: string, desc: string) => {
      const { data: existing } = await supabase.from('achievements').select('id').eq('user_id', user.id).eq('badge_name', name).single()
      if (!existing) {
        await supabase.from('achievements').insert({ user_id: user.id, badge_name: name, description: desc })
        unlockedAchievements.push(name)
      }
    }

    if (newTasksCompleted === 1) await awardAchievement('First Mission', 'Completed your very first mission!')
    if (newStreak === 3 && isNewDay) await awardAchievement('3 Day Streak', 'Maintained a 3-day learning streak!')
    if (newStreak === 7 && isNewDay) await awardAchievement('7 Day Streak', 'A full week of non-stop learning!')
    
    if (level.is_boss_level) {
      await awardAchievement('Boss Defeated', `Defeated a boss level at Global Level ${newGlobalLevel}!`)
    }

    // If we unlocked a level in a new section, it means a week is completed
    const justFinishedWeek = (!sameSecNext || sameSecNext.length === 0);
    if (justFinishedWeek && level.section_id) {
      await awardAchievement('Week Completed', 'Successfully finished an entire week of missions!')
    }

    responseData = {
      success: true,
      levelUp: true,
      globalLevelUp: isGlobalLevelUp,
      xpGained: finalXpReward,
      baseXp: level.xp_reward,
      multiplier: xpMultiplier,
      newXp,
      newStreak,
      unlockedAchievements,
      newRank: isGlobalLevelUp ? rankTitle : null
    }
  }

  return NextResponse.json(responseData)
}
