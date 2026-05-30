'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(data: {
  primary_goal: string;
  target_role: string;
  current_level: string;
  target_timeline: string;
  available_hours: number;
  learning_style: string;
  roadmap_intensity: string;
  skills: string[];
}): Promise<{ error?: string }> {
  console.log('[Onboarding] Starting completeOnboarding...')

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[Onboarding] Auth error:', authError?.message)
    return { error: 'Not authenticated. Please log in again.' }
  }

  console.log('[Onboarding] User authenticated:', user.id, user.email)

  // Use UPSERT so the row is created if it doesn't exist yet, or updated if it does.
  // We added an INSERT policy to public.profiles to allow this.
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Explorer',
      primary_goal: data.primary_goal,
      target_role: data.target_role,
      current_level: data.current_level,
      target_timeline: data.target_timeline,
      available_hours: data.available_hours,
      learning_style: data.learning_style,
      roadmap_intensity: data.roadmap_intensity,
      is_onboarded: true,
      readiness_score: 10,
    }, { onConflict: 'id' })

  if (upsertError) {
    console.error('[Onboarding] Profile upsert error:', upsertError.message, '| Code:', upsertError.code, '| Details:', upsertError.details, '| Hint:', upsertError.hint)
    return { error: `Failed to save profile: ${upsertError.message}` }
  }

  // Save skills if the user selected any
  if (data.skills && data.skills.length > 0) {
    const proficiency = data.current_level ? data.current_level.toLowerCase() : 'beginner';
    
    const skillsToInsert = data.skills.map(skill => ({
      user_id: user.id,
      skill_name: skill,
      proficiency_level: proficiency,
      is_strength: true
    }));

    const { error: skillsError } = await supabase
      .from('skills')
      .upsert(skillsToInsert, { onConflict: 'user_id, skill_name' });

    if (skillsError) {
      console.error('[Onboarding] Skills save error:', skillsError.message);
      // We don't block the entire onboarding just for skills, but log it
    }
  }

  console.log('[Onboarding] Profile saved successfully. Redirecting to /dashboard...')

  revalidatePath('/dashboard')
  revalidatePath('/onboarding')

  // redirect() throws a special Next.js error — must be outside any try/catch
  redirect('/dashboard')
}
