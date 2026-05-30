import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Award, Target, Brain, Flame, Activity, TrendingUp } from 'lucide-react'

export default async function ProfileAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: achievements }, { data: skills }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('achievements').select('*').eq('user_id', user.id),
    supabase.from('skills').select('*').eq('user_id', user.id)
  ])

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      
      {/* Header Profile */}
      <div className="bg-card/50 backdrop-blur-md border border-border p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg border-4 border-background">
          <span className="text-4xl font-bold text-white">{profile?.full_name?.charAt(0) || 'U'}</span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h1 className="text-4xl font-extrabold">{profile?.full_name}</h1>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="px-4 py-1 bg-primary/20 text-primary rounded-full font-semibold border border-primary/30">
              Level {profile?.global_level} • {profile?.rank_title}
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-5 h-5" /> {profile?.current_streak} Day Streak
            </span>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Targeting: {profile?.target_role} • {profile?.primary_goal}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Readiness Score */}
        <div className="bg-card/30 border border-border p-6 rounded-3xl flex flex-col justify-center items-center">
          <Target className="w-8 h-8 text-emerald-400 mb-2" />
          <h3 className="text-muted-foreground font-medium">Readiness Score</h3>
          <div className="text-5xl font-black mt-2 text-emerald-400">{profile?.readiness_score}%</div>
        </div>

        {/* Velocity */}
        <div className="bg-card/30 border border-border p-6 rounded-3xl flex flex-col justify-center items-center">
          <Activity className="w-8 h-8 text-indigo-400 mb-2" />
          <h3 className="text-muted-foreground font-medium">Learning Velocity</h3>
          <div className="text-5xl font-black mt-2 text-indigo-400">{profile?.learning_velocity || '1.0'}x</div>
        </div>

        {/* Total XP */}
        <div className="bg-card/30 border border-border p-6 rounded-3xl flex flex-col justify-center items-center">
          <TrendingUp className="w-8 h-8 text-primary mb-2" />
          <h3 className="text-muted-foreground font-medium">Total XP</h3>
          <div className="text-5xl font-black mt-2 text-primary">{profile?.total_xp}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Skills Memory */}
        <div className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">AI Skill Matrix</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills?.length ? skills.map((s: any) => (
              <div key={s.id} className="px-4 py-2 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-xl text-sm font-medium">
                {s.skill_name} • <span className="opacity-70 capitalize">{s.proficiency_level}</span>
              </div>
            )) : (
              <p className="text-muted-foreground">Your AI coach is still learning your skills.</p>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold">Achievements</h2>
          </div>
          <div className="space-y-4">
            {achievements?.length ? achievements.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-border">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{a.badge_name}</h4>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground">Complete roadmap boss levels to unlock achievements.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
