'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Check, Star, Zap, Crown, ExternalLink, X, Swords, BookOpen, Target, Sparkles, Trophy, Flame, Navigation, Map } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

const taskTypeIcon: Record<string, string> = {
  learn: '📖', practice: '⚡', build: '🔨', apply: '🚀',
  review: '✅', challenge: '🔥', portfolio: '💼', interview: '🎯'
}

const getWorldTheme = (num: number) => {
  const themes = [
    { title: "Digital Workshop", intro: "The foundation of the web. Learn to speak to browsers.", bg: "from-blue-900/40 to-blue-950/40", border: "border-blue-500/30", text: "text-blue-400", glow: "shadow-[0_0_60px_rgba(59,130,246,0.2)]", particles: "bg-blue-400" },
    { title: "JavaScript Forest", intro: "A wild untamed wilderness of logic and variables.", bg: "from-green-900/40 to-emerald-950/40", border: "border-green-500/30", text: "text-green-400", glow: "shadow-[0_0_60px_rgba(16,185,129,0.2)]", particles: "bg-emerald-400" },
    { title: "DOM Lab", intro: "Experiment and manipulate the document structure.", bg: "from-teal-900/40 to-purple-950/40", border: "border-teal-500/30", text: "text-teal-400", glow: "shadow-[0_0_60px_rgba(20,184,166,0.2)]", particles: "bg-teal-400" },
    { title: "React Kingdom", intro: "A highly structured realm of reusable components.", bg: "from-cyan-900/40 to-blue-950/40", border: "border-cyan-500/30", text: "text-cyan-400", glow: "shadow-[0_0_60px_rgba(6,182,212,0.2)]", particles: "bg-cyan-400" },
    { title: "Backend City", intro: "The sprawling urban center of servers and APIs.", bg: "from-slate-800/40 to-orange-950/40", border: "border-orange-500/30", text: "text-orange-400", glow: "shadow-[0_0_60px_rgba(249,115,22,0.2)]", particles: "bg-orange-400" },
    { title: "Database Vault", intro: "Deep underground, where data is securely guarded.", bg: "from-yellow-900/40 to-amber-950/40", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-[0_0_60px_rgba(245,158,11,0.2)]", particles: "bg-amber-400" },
    { title: "Portfolio Arena", intro: "Showcase your skills and build your legend.", bg: "from-fuchsia-900/40 to-pink-950/40", border: "border-pink-500/30", text: "text-pink-400", glow: "shadow-[0_0_60px_rgba(236,72,153,0.2)]", particles: "bg-pink-400" },
    { title: "Interview Castle", intro: "The final gauntlet before you claim your career.", bg: "from-yellow-700/40 to-amber-900/40", border: "border-yellow-500/40", text: "text-yellow-400", glow: "shadow-[0_0_80px_rgba(234,179,8,0.25)]", particles: "bg-yellow-400" }
  ];
  return themes[(num - 1) % themes.length];
}

const Mascot = ({ active, message }: { active: boolean, message: string }) => {
  if (!active) return null;
  return (
    <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="mb-2 bg-white text-indigo-950 text-[11px] font-bold px-3 py-1.5 rounded-xl rounded-br-sm shadow-xl whitespace-nowrap border border-white/20"
      >
        {message}
      </motion.div>
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="text-[40px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
      >
        🤖
      </motion.div>
    </div>
  )
}

export default function RoadmapTree({ sections, roadmap, playerStats }: { sections: any[], roadmap: any, playerStats?: any }) {
  const [selectedLevel, setSelectedLevel] = useState<any | null>(null)
  const [submittingLevel, setSubmittingLevel] = useState(false)
  const [taskStatuses, setTaskStatuses] = useState<Record<string, boolean>>({})
  const [proofText, setProofText] = useState('')
  const [celebrationData, setCelebrationData] = useState<any | null>(null)
  const router = useRouter()

  const handleOpenLevel = (level: any) => {
    setSelectedLevel(level)
    setProofText('')
    const initialStatuses: Record<string, boolean> = {}
    level.roadmap_tasks?.forEach((t: any) => {
      initialStatuses[t.id] = t.status === 'completed' || t.status === 'approved'
    })
    setTaskStatuses(initialStatuses)
  }

  const toggleTask = async (task: any) => {
    const isNowChecked = !taskStatuses[task.id]
    setTaskStatuses(prev => ({ ...prev, [task.id]: isNowChecked }))
    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, status: isNowChecked ? 'completed' : 'pending' })
      })
    } catch (e) {
      setTaskStatuses(prev => ({ ...prev, [task.id]: !isNowChecked }))
    }
  }

  const allTasksDone = selectedLevel
    ? (selectedLevel.roadmap_tasks?.length > 0 &&
       selectedLevel.roadmap_tasks?.every((t: any) => taskStatuses[t.id]))
    : false

  const completeLevel = async () => {
    if (!selectedLevel || submittingLevel) return
    setSubmittingLevel(true)
    try {
      const res = await fetch('/api/proofs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: selectedLevel.id, proofText })
      })
      const data = await res.json()
      if (data.success) {
        setSelectedLevel(null) // close level modal
        setCelebrationData({
          xp: data.xpGained,
          multiplier: data.multiplier,
          streak: data.newStreak,
          achievements: data.unlockedAchievements || [],
          rankUp: data.newRank,
          message: selectedLevel.motivational_message || "Keep going. The next quest awaits."
        })
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'],
          zIndex: 9999
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmittingLevel(false)
    }
  }

  const closeCelebration = () => {
    setCelebrationData(null)
    router.refresh()
  }

  const generatedWeeksCount = roadmap?.generated_weeks_count ?? sections.length
  const totalWeeks = roadmap?.total_weeks ?? 8
  const pendingWeeks = Math.max(0, totalWeeks - generatedWeeksCount)
  // Wider path offsets for snaking horizontally to use more width
  const desktopOffsets = [0, 80, 160, 80, 0, -80, -160, -80]

  // Flatten levels to find active and next missions
  const allLevels = sections.flatMap(s => s.roadmap_levels.map((l: any) => ({ ...l, section_number: s.section_number })))
  const activeLevelIdx = allLevels.findIndex(l => l.status === 'unlocked')
  const activeLevel = activeLevelIdx !== -1 ? allLevels[activeLevelIdx] : null
  const nextLevel = activeLevelIdx !== -1 && activeLevelIdx + 1 < allLevels.length ? allLevels[activeLevelIdx + 1] : null
  
  // Calculate missions until next boss
  let missionsToBoss = 0;
  if (activeLevel) {
    for (let i = activeLevelIdx; i < allLevels.length; i++) {
      if (allLevels[i].is_boss_level) {
        missionsToBoss = i - activeLevelIdx + 1;
        break;
      }
    }
  }

  const getMascotMessage = () => {
    if (activeLevel?.is_boss_level) return "Boss Battle Time!";
    if (missionsToBoss === 1) return "Boss Battle next!";
    if (missionsToBoss === 2) return "Only 1 mission until Boss Battle!";
    if (playerStats && playerStats.xpForNextLevel - playerStats.currentXp <= 500 && playerStats.xpForNextLevel - playerStats.currentXp > 0) {
      return `Only ${playerStats.xpForNextLevel - playerStats.currentXp} XP until ${playerStats.globalLevel + 1}!`;
    }
    if (nextLevel) return `Clear this to unlock Day ${nextLevel.level_number}.`;
    return "You're doing great!";
  }

  return (
    <div className="relative pt-4 pb-24 w-full max-w-full overflow-hidden">
      
      {/* Current Mission HUD */}
      {activeLevel && (
        <div className="mb-12 relative z-20">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shrink-0">
              <Map className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest font-black text-indigo-400 mb-1 flex items-center justify-center sm:justify-start gap-1">
                <Navigation className="w-3 h-3" /> Current Objective
              </div>
              <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{activeLevel.title}</h3>
              <p className="text-sm text-indigo-200/80 line-clamp-1">{activeLevel.objective?.split('Why this matters:')[0]?.trim() || "Continue your adventure."}</p>
            </div>
            <div className="shrink-0">
              <button 
                onClick={() => handleOpenLevel(activeLevel)}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95"
              >
                Start Mission
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-32 relative z-10 flex flex-col items-center">
        {sections.map((section, sIdx) => {
          const theme = getWorldTheme(section.section_number)
          
          return (
            <div key={section.id} className="relative w-full max-w-4xl">
              {/* World Island Container */}
              <div className={`absolute inset-0 bg-gradient-to-b ${theme.bg} rounded-[3rem] border ${theme.border} -mx-4 sm:-mx-12 pointer-events-none opacity-80 backdrop-blur-[4px] ${theme.glow}`} />
              
              {/* Dynamic Particles for atmosphere */}
              <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none opacity-60">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, i % 2 === 0 ? 20 : -20, 0],
                      opacity: [0.1, 0.6, 0.1]
                    }}
                    transition={{ repeat: Infinity, duration: 4 + (i % 4), delay: i * 0.3 }}
                    className={`absolute w-2 h-2 rounded-full blur-[1px] ${theme.particles}`}
                    style={{
                      left: `${10 + (i * 7)}%`,
                      top: `${10 + (i * 8)}%`
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 w-full flex flex-col items-center pt-8 pb-16">
                {/* World Header */}
                <div className="text-center relative mb-16 px-4">
                  <div className="inline-flex flex-col items-center">
                    <div className={`text-[10px] font-black ${theme.text} tracking-[4px] uppercase mb-1 bg-background/80 px-4 py-1 rounded-full border ${theme.border}`}>
                      World {section.section_number}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md mt-2">{theme.title}</h2>
                    <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto font-medium italic">"{theme.intro}"</p>
                  </div>
                </div>

                {/* Level Nodes */}
                <div className="space-y-16 w-full flex flex-col items-center">
                  {section.roadmap_levels
                    .sort((a: any, b: any) => a.level_number - b.level_number)
                    .map((level: any, lIdx: number) => {
                      const desktopOffset = desktopOffsets[lIdx % desktopOffsets.length]
                      const isLocked = level.status === 'locked'
                      const isCompleted = level.status === 'completed'
                      const isBoss = level.is_boss_level
                      const isActive = level.status === 'unlocked'

                      return (
                        <div 
                          key={level.id} 
                          className="relative flex flex-col items-center translate-x-0 md:translate-x-[var(--desktop-offset)] transition-transform w-32" 
                          style={{ '--desktop-offset': `${desktopOffset}px` } as any}
                        >
                          
                          {/* Connecting Path Line SVG (Desktop only) */}
                          {lIdx < section.roadmap_levels.length - 1 && (
                            <div className="hidden md:block absolute top-[60px] left-1/2 w-full h-[8rem] -z-10 pointer-events-none opacity-30">
                              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                <path
                                  d={`M 0,0 C 0,60 ${desktopOffsets[(lIdx + 1) % desktopOffsets.length] - desktopOffset},60 ${desktopOffsets[(lIdx + 1) % desktopOffsets.length] - desktopOffset},128`}
                                  fill="none"
                                  stroke={isCompleted ? '#10b981' : '#334155'}
                                  strokeWidth="6"
                                  strokeDasharray={isCompleted ? "none" : "8,8"}
                                />
                              </svg>
                            </div>
                          )}

                          {/* Connecting Line (Mobile) */}
                          {lIdx < section.roadmap_levels.length - 1 && (
                            <div className="md:hidden absolute top-[60px] left-1/2 w-1.5 h-[8rem] -ml-[3px] -z-10 bg-slate-800 rounded-full">
                              <div className={`w-full ${isCompleted ? 'h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'h-0'}`} />
                            </div>
                          )}

                          {/* Node */}
                          <div className="relative group mt-4">
                            {isActive && (
                              <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-500 text-white font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-bounce z-50 border border-indigo-300 flex items-center gap-1.5">
                                YOU ARE HERE
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-500"></div>
                              </div>
                            )}
                            <Mascot active={isActive} message={getMascotMessage()} />
                            <motion.button
                              whileHover={{ scale: isLocked ? 1 : 1.1 }}
                              whileTap={{ scale: isLocked ? 1 : 0.95 }}
                              onClick={() => !isLocked && handleOpenLevel(level)}
                              className={`relative z-10 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-${isLocked ? 'not-allowed' : 'pointer'} ${
                                isBoss
                                  ? 'w-[80px] h-[80px] rounded-3xl border-[5px]'
                                  : 'w-[64px] h-[64px] rounded-full border-[4px]'
                              } ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                                  : isLocked
                                  ? 'bg-[#1a1b26] border-white/10 opacity-70 hover:opacity-100'
                                  : isBoss
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-600 border-yellow-200 shadow-[0_0_50px_rgba(245,158,11,0.6)] ring-4 ring-amber-500/30'
                                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-200 shadow-[0_0_40px_rgba(99,102,241,0.6)] ring-4 ring-indigo-500/30'
                              }`}
                            >
                              <div className="absolute inset-0 rounded-[inherit] border border-white/30 pointer-events-none" />

                              {isCompleted ? (
                                <Check className={isBoss ? 'w-10 h-10 text-white' : 'w-7 h-7 text-white'} strokeWidth={3} />
                              ) : isLocked ? (
                                <Lock className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
                              ) : isBoss ? (
                                <Crown className="w-10 h-10 text-white drop-shadow-md" />
                              ) : (
                                <Star className="w-7 h-7 text-white drop-shadow-md" />
                              )}

                              {isActive && !isBoss && (
                                <div className="absolute inset-0 rounded-full bg-indigo-400/40 animate-ping pointer-events-none" />
                              )}
                            </motion.button>
                          </div>

                          {/* Level Details Label (Centered below Node) */}
                          <div className="mt-3 text-center flex flex-col items-center max-w-[140px]">
                            <div className={`text-[10px] font-black ${isCompleted ? 'text-emerald-400' : isActive ? theme.text : 'text-white/40'} tracking-[2px] uppercase mb-0.5`}>
                              {isBoss ? 'Boss Battle' : `Day ${level.level_number}`}
                            </div>
                            {/* Shortened Title to prevent overflow */}
                            <div className={`font-bold text-[13px] ${isActive || isCompleted ? 'text-white' : 'text-white/50'} line-clamp-2 px-2 leading-tight`}>
                              {level.title}
                            </div>
                            
                            {/* XP or Reward Preview */}
                            {(!isLocked || level === nextLevel || (isBoss && missionsToBoss > 0 && missionsToBoss <= 3)) ? (
                              <div className="text-[10px] text-amber-400 flex items-center justify-center gap-1 mt-1 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                <Zap className="w-3 h-3 fill-current" /> {level.xp_reward} XP
                              </div>
                            ) : (
                              <div className="text-[10px] text-white/30 flex items-center justify-center gap-1 mt-1 font-bold">
                                <Lock className="w-3 h-3" /> Locked
                              </div>
                            )}
                          </div>

                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )
        })}

        {/* ── Skeleton Worlds (not yet generated) ────────────────── */}
        {Array.from({ length: pendingWeeks }).map((_, i) => {
          const worldNum = generatedWeeksCount + i + 1
          return (
            <div key={`skeleton-${worldNum}`} className="relative w-full max-w-4xl mt-12">
              <div className="absolute inset-0 bg-white/5 rounded-[3rem] border border-white/5 -mx-4 sm:-mx-12 pointer-events-none opacity-40 backdrop-blur-[2px]" />
              
              <div className="relative z-10 w-full flex flex-col items-center pt-8 pb-12 opacity-40">
                <div className="text-center relative mb-12 px-4">
                  <div className="inline-flex flex-col items-center">
                    <div className="text-[10px] font-black text-white/40 tracking-[4px] uppercase mb-1 bg-background/80 px-4 py-1 rounded-full border border-white/10">
                      World {worldNum}
                    </div>
                    <h2 className="text-xl font-bold text-white/50 flex items-center gap-2 justify-center mt-2">
                      <Lock className="w-4 h-4" /> Generating...
                    </h2>
                  </div>
                </div>
                <div className="space-y-16 w-full flex flex-col items-center">
                  {[1, 2, 3].map((ph, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      {idx < 2 && (
                        <div className="absolute top-[60px] left-1/2 w-1 h-[8rem] -ml-[2px] -z-10 bg-white/10 rounded-full" />
                      )}
                      <div className="w-[64px] h-[64px] rounded-full bg-[#1a1b26] border-[4px] border-white/5 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Celebration Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {celebrationData && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-[2.5rem] bg-gradient-to-b from-[#1a1b26] to-[#0f1015] border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.4)] overflow-hidden text-center p-8"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1.2, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-8xl mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"
              >
                🏆
              </motion.div>

              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2">Level Complete!</h2>
              <p className="text-sm text-indigo-200 font-medium px-4 mb-8">"{celebrationData.message}"</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">XP Gained</span>
                  <div className="flex items-center gap-1.5 text-2xl font-black text-white">
                    <Zap className="w-5 h-5 text-amber-400 fill-current" />
                    +{celebrationData.xp}
                  </div>
                  {celebrationData.multiplier > 1 && (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full mt-1">
                      {celebrationData.multiplier}x Streak Bonus
                    </span>
                  )}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold mb-1">Day Streak</span>
                  <div className="flex items-center gap-1.5 text-2xl font-black text-white">
                    <Flame className="w-5 h-5 text-orange-500 fill-current" />
                    {celebrationData.streak}
                  </div>
                </div>
              </div>

              {celebrationData.achievements && celebrationData.achievements.length > 0 && (
                <div className="mb-8 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-amber-400 font-black">Achievements Unlocked</div>
                  {celebrationData.achievements.map((ach: string) => (
                    <div key={ach} className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl py-2 px-4 inline-flex items-center gap-2 m-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm text-amber-100">{ach}</span>
                    </div>
                  ))}
                </div>
              )}

              {celebrationData.rankUp && (
                <div className="mb-8 p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl">
                  <div className="text-xs uppercase tracking-widest text-purple-300 font-bold mb-1">Rank Up!</div>
                  <div className="text-lg font-black text-white">You are now a {celebrationData.rankUp}</div>
                </div>
              )}

              <button
                onClick={closeCelebration}
                className="w-full py-4 rounded-2xl font-black text-[15px] bg-white text-black hover:bg-gray-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.98]"
              >
                Continue Adventure
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mission Quest Panel (Level Modal) ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLevel && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLevel(null)}
          >
            <motion.div
              className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] bg-[#12131c] border border-white/10 shadow-[0_-8px_80px_rgba(0,0,0,0.8)] sm:shadow-2xl"
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`sticky top-0 z-20 p-6 sm:p-8 pb-6 border-b border-white/5 ${selectedLevel.is_boss_level ? 'bg-gradient-to-r from-amber-950/90 via-orange-950/90 to-red-950/90' : 'bg-[#12131c]/95'} backdrop-blur-xl`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      {selectedLevel.is_boss_level ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[3px] uppercase text-amber-950 bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                          <Crown className="w-3 h-3" /> Boss Battle
                        </span>
                      ) : (
                        <span className="text-[10px] font-black tracking-[4px] uppercase text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1 rounded-full">
                          Quest {selectedLevel.level_number}
                        </span>
                      )}
                      <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                        <Zap className="w-3 h-3 fill-current" />{selectedLevel.xp_reward} XP
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-1">{selectedLevel.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Quest Story & Objective */}
                <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-[2rem] p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-indigo-500/20 items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black tracking-[3px] uppercase text-indigo-400 mb-1.5">Mission Brief</div>
                      <p className="text-[15px] sm:text-[16px] text-white/90 leading-relaxed font-medium">
                        {selectedLevel.objective?.split('Why this matters:')[0]?.trim()}
                      </p>
                      {selectedLevel.objective?.includes('Why this matters:') && (
                        <div className="mt-4 bg-white/5 border border-white/5 rounded-xl p-4">
                          <p className="text-[11px] font-black uppercase tracking-widest text-indigo-300 mb-1">Strategic Value</p>
                          <p className="text-sm text-indigo-200/80 font-medium">
                            {selectedLevel.objective.split('Why this matters:')[1]?.trim()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <Swords className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-black text-xl text-white">Objectives</h3>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                        {Object.values(taskStatuses).filter(Boolean).length}/{selectedLevel.roadmap_tasks?.length || 0} Complete
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedLevel.roadmap_tasks
                      ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((task: any) => {
                        const isDone = taskStatuses[task.id] || false
                        return (
                          <motion.label
                            key={task.id}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 select-none group ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                            }`}
                          >
                            <div className="shrink-0 relative">
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-white/20 group-hover:border-emerald-500/50'}`}>
                                {isDone && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={4} /></motion.div>}
                              </div>
                              <input type="checkbox" className="hidden" checked={isDone} onChange={() => toggleTask(task)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-lg sm:text-xl drop-shadow-md">{taskTypeIcon[task.type] || '📌'}</span>
                                <p className={`text-[14px] sm:text-[15px] font-bold transition-colors line-clamp-2 ${isDone ? 'text-emerald-200/50 line-through decoration-emerald-500/30' : 'text-white'}`}>
                                  {task.title}
                                </p>
                              </div>
                            </div>
                            <span className={`hidden sm:inline-block text-[10px] font-black uppercase tracking-[2px] px-3 py-1 rounded-full shrink-0 ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                              {task.type}
                            </span>
                          </motion.label>
                        )
                      })}
                  </div>
                </div>

                {/* Resources + Challenge */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-5 sm:p-6 bg-[#1a1b26] border border-white/5 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <h4 className="font-black text-base text-white">Intel & Resources</h4>
                    </div>
                    <ul className="space-y-3">
                      {(selectedLevel.resources || []).map((r: any, i: number) => (
                        <li key={i}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-sm text-blue-300/80 hover:text-blue-300 transition-colors group"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium underline-offset-4 hover:underline leading-tight line-clamp-2">{r.title}</span>
                          </a>
                        </li>
                      ))}
                      {(!selectedLevel.resources || selectedLevel.resources.length === 0) && (
                        <li className="text-sm text-white/30 font-medium">No external intel required.</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-5 sm:p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h4 className="font-black text-base text-white">Practice Challenge</h4>
                    </div>
                    <p className="text-sm text-purple-200/80 leading-relaxed font-medium">
                      {selectedLevel.practice_challenge || 'Apply today\'s skills in a mini-project.'}
                    </p>
                  </div>
                </div>

                {/* Proof Input */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <span className="text-xs">📝</span>
                    </div>
                    <h4 className="font-black text-sm text-white">Mission Proof <span className="text-white/40 font-medium ml-1">(Optional but builds habit)</span></h4>
                  </div>
                  <textarea
                    value={proofText}
                    onChange={e => setProofText(e.target.value)}
                    placeholder="Link your commit, project URL, or summarize your work..."
                    rows={2}
                    className="w-full bg-[#1a1b26] border border-white/10 rounded-2xl p-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-all"
                  />
                </div>

                {/* Progress bar for tasks inside modal */}
                {(selectedLevel.roadmap_tasks?.length || 0) > 0 && (
                  <div className="bg-black/30 p-4 rounded-[2rem] border border-white/5">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                        initial={false}
                        animate={{
                          width: `${((Object.values(taskStatuses).filter(Boolean).length) / (selectedLevel.roadmap_tasks?.length || 1)) * 100}%`
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Complete Button */}
                <button
                  onClick={completeLevel}
                  disabled={submittingLevel || !allTasksDone}
                  className={`w-full py-5 rounded-[2rem] font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 ${
                    allTasksDone
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-emerald-950 shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:brightness-110 hover:shadow-[0_10px_50px_rgba(16,185,129,0.6)] active:scale-[0.98]'
                      : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {submittingLevel ? (
                    <><span className="animate-spin text-xl">⚡</span> Claiming Rewards...</>
                  ) : allTasksDone ? (
                    <><Zap className="w-6 h-6 fill-current" /> Complete Quest · Claim {selectedLevel.xp_reward} XP</>
                  ) : (
                    <>Complete all objectives to unlock</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
