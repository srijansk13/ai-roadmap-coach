import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Flame, Target, Star, Briefcase, Clock, Zap, BookOpen, Map, ArrowRight } from 'lucide-react'
import { GenerateRoadmapCard } from './generate-roadmap-card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_onboarded) {
    redirect('/onboarding')
  }
  
  // Check if they already have an active roadmap
  const { data: activeRoadmap } = await supabase
    .from('roadmaps')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.full_name || 'Explorer'}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Ready to continue your {profile?.rank_title || 'Novice'} journey?
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-5 py-2.5 rounded-xl shadow-inner">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-lg text-orange-500">{profile?.current_streak || 0} Day Streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2 text-primary">
            <Trophy className="w-5 h-5" />
            <h3 className="font-semibold">Level {profile?.global_level || 1}</h3>
          </div>
          <p className="text-3xl font-bold">{profile?.total_xp || 0} <span className="text-sm font-normal text-muted-foreground">XP</span></p>
        </div>
        
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2 text-indigo-400">
            <Target className="w-5 h-5" />
            <h3 className="font-semibold">Tasks Done</h3>
          </div>
          <p className="text-3xl font-bold">{profile?.tasks_completed || 0}</p>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2 text-emerald-400">
            <Star className="w-5 h-5" />
            <h3 className="font-semibold">Readiness</h3>
          </div>
          <p className="text-3xl font-bold">{profile?.readiness_score || 0}%</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Summary */}
        <div className="lg:col-span-1 bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <h3 className="text-lg font-bold border-b border-border pb-3">Your Profile Summary</h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Primary Goal</p>
                <p className="font-medium">{profile?.primary_goal || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Target Role</p>
                <p className="font-medium">{profile?.target_role || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Timeline & Commitment</p>
                <p className="font-medium">{profile?.target_timeline || 'Flexible'}</p>
                <p className="text-sm text-muted-foreground">{profile?.available_hours || 10} hours / week</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Level</p>
                <p className="font-medium capitalize">{profile?.current_level || 'Beginner'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Learning Style</p>
                <p className="font-medium">{profile?.learning_style || 'Mixed'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Action Area */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          {activeRoadmap ? (
            <div className="bg-card/40 backdrop-blur-xl border border-primary/20 p-8 rounded-2xl flex flex-col items-center text-center gap-4 shadow-lg">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Map className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Active Quest: {activeRoadmap.title}</h2>
                <p className="text-muted-foreground mt-2">Your personalized roadmap is ready and waiting.</p>
              </div>
              <Link 
                href="/dashboard/roadmaps"
                className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                Resume Roadmap <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <GenerateRoadmapCard />
          )}
        </div>
      </div>
    </div>
  )
}
