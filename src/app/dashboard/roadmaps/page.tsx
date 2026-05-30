import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import RoadmapTree from './roadmap-tree'
import RoadmapChunkPoller from './roadmap-chunk-poller'
import { Flame, Star, Target, RefreshCw, Lock } from 'lucide-react'
import { sanitizeLegacyResources } from '@/lib/resource-resolver'

export default async function RoadmapsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch active or partially ready roadmap
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'partially_ready', 'generating', 'failed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp, current_streak, global_level, rank_title')
    .eq('id', user.id)
    .single()

  const { count: achievementCount } = await supabase
    .from('achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
          <span className="text-4xl">🗺️</span>
        </div>
        <h2 className="text-2xl font-bold">No Active Roadmap</h2>
        <p className="text-muted-foreground max-w-md">
          Head over to the AI Coach to strategize and generate your personalized progression path.
        </p>
      </div>
    )
  }

  // Fetch structure
  const { data: sections } = await supabase
    .from('roadmap_sections')
    .select('*, roadmap_levels(*, roadmap_tasks(*))')
    .eq('roadmap_id', roadmap.id)
    .order('section_number', { ascending: true })

  // Sort levels within sections and sanitize resources
  const formattedSections = sections?.map(s => ({
    ...s,
    roadmap_levels: s.roadmap_levels.sort((a: any, b: any) => a.level_number - b.level_number).map((l: any) => ({
      ...l,
      resources: sanitizeLegacyResources(l.resources || [])
    }))
  })) || []

  // Calculate progress & active elements
  let completedLevels = 0
  let totalLevels = 0
  let activeMission = "None"
  let nextBoss = "None"
  let currentWorld = 1

  formattedSections.forEach(s => {
    s.roadmap_levels.forEach((l: any) => {
      totalLevels++
      if (l.status === 'completed') completedLevels++
      if (l.status === 'unlocked' && activeMission === "None") {
        activeMission = l.title
        currentWorld = s.section_number
      }
      if (l.is_boss_level && l.status !== 'completed' && nextBoss === "None") {
        nextBoss = l.title
      }
    })
  })
  
  // Approximate total levels if fully generated
  const expectedTotalLevels = roadmap.total_weeks * 6 // roughly
  const completionPercentage = Math.round((completedLevels / (totalLevels > 0 ? expectedTotalLevels : 1)) * 100)

  const deleteRoadmap = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.from('roadmaps').delete().eq('id', roadmap.id)
    revalidatePath('/dashboard/roadmaps')
    redirect('/dashboard/roadmaps')
  }

  // XP Progress Calculation
  const currentXp = profile?.total_xp || 0
  const globalLevel = profile?.global_level || 1
  const xpForCurrentLevel = (globalLevel - 1) * 500
  const xpForNextLevel = globalLevel * 500
  const xpProgress = currentXp - xpForCurrentLevel
  const xpNeeded = 500
  const xpPercentage = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100))

  return (
    <div className="relative min-h-screen -m-4 md:-m-8">
      {/* Global Game Map Background */}
      <div className="absolute inset-0 z-0 bg-[#0f111a] overflow-hidden">
        {/* Subtle grid pattern for map feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Deep radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      </div>

      <div className="flex flex-col xl:flex-row gap-8 w-full max-w-[1600px] mx-auto py-12 px-4 sm:px-8 lg:px-12 relative z-10">
        
        {/* Main Roadmap Area (70%) */}
        <div className="flex-1 xl:max-w-[calc(100%-400px)]">
          <div className="mb-12 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-semibold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <span>{roadmap.version}</span>
              <span>•</span>
              <span>{roadmap.duration_days} Days</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">{roadmap.title}</h1>
            <p className="text-xl text-muted-foreground font-medium">{roadmap.career_goal}</p>
          </div>

        <RoadmapTree 
          sections={formattedSections} 
          roadmap={roadmap} 
          playerStats={{
            currentXp,
            xpForNextLevel,
            globalLevel,
            rankTitle: profile?.rank_title || 'Novice'
          }}
        />
      </div>

      {/* Progress Sidebar -> Premium Player HUD */}
      <div className="w-full xl:w-[380px] shrink-0 space-y-6 sticky top-8 self-start">
        <RoadmapChunkPoller roadmap={roadmap} />
        
        <div className="bg-[#1a1b26]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[64px] pointer-events-none" />

          {/* Player Rank & Level */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                <div className="w-full h-full bg-[#1a1b26] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20" />
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-purple-300 z-10">
                    {globalLevel}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-500 rounded-full border-2 border-[#1a1b26] flex items-center justify-center shadow-md">
                <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-xl text-white tracking-tight">{profile?.rank_title || 'Novice'}</h3>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Level {globalLevel} Player</p>
            </div>
          </div>
          
          {/* XP Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Next Rank</span>
              <span className="text-sm font-black text-white">{currentXp} <span className="text-muted-foreground font-semibold">/ {xpForNextLevel} XP</span></span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                style={{ width: `${xpPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-orange-500/20 rounded-full blur-xl group-hover:bg-orange-500/30 transition-colors" />
              <Flame className="w-5 h-5 text-orange-400 mb-2 relative z-10" />
              <div className="text-2xl font-black text-white relative z-10">{profile?.current_streak || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold relative z-10">Day Streak</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/20 rounded-full blur-xl group-hover:bg-amber-500/30 transition-colors" />
              <Target className="w-5 h-5 text-amber-400 mb-2 relative z-10" />
              <div className="text-2xl font-black text-white relative z-10">{achievementCount || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold relative z-10">Achievements</div>
            </div>
          </div>

          {/* Current Quest & Journey Info */}
          <div className="space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group hover:bg-indigo-500/15 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Current World {currentWorld}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </div>
              <div className="font-bold text-white text-[15px] line-clamp-2 mb-2 pr-4">{activeMission !== "None" ? activeMission : "Ready for next adventure"}</div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Target className="w-3.5 h-3.5" /> Next up: {nextBoss !== "None" ? nextBoss : "More quests"}
              </div>
            </div>

            {currentWorld < (sections?.length || 0) && (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 border-dashed">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Next World Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-white/40" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white/70">World {currentWorld + 1}</div>
                    <div className="text-xs text-white/40">Complete current world to unlock</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Campaign Progress</span>
              <span className="text-primary">{completionPercentage}%</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(completionPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <form action={deleteRoadmap}>
          <button 
            type="submit" 
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 font-bold text-xs uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart Campaign
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}

