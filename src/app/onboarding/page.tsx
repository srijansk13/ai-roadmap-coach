'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { completeOnboarding } from './actions'
import { ArrowRight, ArrowLeft, Target, Briefcase, Zap, Clock, Code, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'

const goals = ['Internship', 'Job Switch', 'Placement Prep', 'Full Stack Developer', 'AI/ML Engineer', 'Data Scientist', 'DSA Mastery', 'Freelancing', 'Startup', 'Skill Building']
const levels = ['Beginner', 'Intermediate', 'Advanced']
const styles = ['Visual (Videos)', 'Reading (Docs)', 'Interactive (Projects)', 'Mixed']
const intensities = ['Relaxed (1-2 hrs/day)', 'Standard (3-4 hrs/day)', 'Intense (5+ hrs/day)']
const suggestedSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'DSA', 'Machine Learning', 'TypeScript', 'Docker', 'Java', 'C++']

const TOTAL_STEPS = 6

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    primary_goal: '',
    target_role: '',
    current_level: '',
    target_timeline: '',
    available_hours: 10,
    learning_style: '',
    roadmap_intensity: '',
    skills: [] as string[]
  })

  const updateForm = (key: string, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const goNext = () => {
    setDirection(1)
    setStep(p => Math.min(TOTAL_STEPS, p + 1))
  }

  const goPrev = () => {
    setDirection(-1)
    setStep(p => Math.max(1, p - 1))
  }

  const canProceed = () => {
    if (step === 1) return formData.primary_goal !== ''
    if (step === 2) return formData.target_role.trim() !== '' && formData.target_timeline.trim() !== ''
    if (step === 3) return formData.current_level !== ''
    if (step === 5) return formData.roadmap_intensity !== ''
    if (step === 6) return formData.learning_style !== ''
    return true // step 4 (skills) is optional
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const result = await completeOnboarding(formData)

      // If redirect() fires successfully, this code won't run.
      // If we reach here, it means an error was returned.
      if (result?.error) {
        console.error('[Onboarding Client] Error from server action:', result.error)
        setSubmitError(result.error)
        setIsSubmitting(false)
      }
      // If result is undefined or has no error but also no redirect (shouldn't happen), reset
      else if (result && !(result as any).success) {
        setSubmitError('Something went wrong. Please try again.')
        setIsSubmitting(false)
      }
    } catch (err: unknown) {
      // Next.js redirect() throws a special error. We MUST rethrow it so Next.js can handle the navigation.
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err
      }
      if (
        err !== null &&
        typeof err === 'object' &&
        'digest' in err &&
        typeof (err as { digest: string }).digest === 'string' &&
        (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      ) {
        throw err
      }

      console.error('[Onboarding Client] Unexpected error:', err)
      setSubmitError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 80 : -80, opacity: 0 }),
  }

  const stepColors = ['text-primary', 'text-indigo-400', 'text-emerald-400', 'text-rose-400', 'text-amber-400', 'text-cyan-400']
  const stepColor = stepColors[step - 1]

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Premium ambient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-[200px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Setting up your AI Profile</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Let's build your roadmap</h1>
          <p className="text-muted-foreground mt-1">Tell us about you so your AI coach can personalize everything</p>
        </div>

        {/* Progress */}
        <div className="mb-6 px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-xs text-muted-foreground font-medium">{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 rounded-full"
              initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i + 1 < step
                    ? 'bg-primary scale-100'
                    : i + 1 === step
                    ? 'bg-primary scale-125 ring-2 ring-primary/30'
                    : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-card/30 backdrop-blur-xl border border-white/8 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10 min-h-[380px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Goal */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`flex items-center gap-3 mb-6 ${stepColor}`}>
                    <Target className="w-6 h-6" />
                    <h2 className="text-2xl font-bold text-foreground">What's your primary goal?</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {goals.map(g => (
                      <button
                        key={g}
                        onClick={() => updateForm('primary_goal', g)}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                          formData.primary_goal === g
                            ? 'bg-primary/15 border-primary shadow-[0_0_20px_rgba(59,130,246,0.25)] text-foreground'
                            : 'bg-background/40 border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="font-medium text-sm">{g}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Role & Timeline */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div className={`flex items-center gap-3 ${stepColor}`}>
                    <Briefcase className="w-6 h-6" />
                    <h2 className="text-2xl font-bold text-foreground">What role are you targeting?</h2>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Target Role *</label>
                    <input
                      type="text"
                      value={formData.target_role}
                      onChange={e => updateForm('target_role', e.target.value)}
                      placeholder="e.g. Frontend Developer, ML Engineer, Backend SDE..."
                      className="w-full bg-background/50 border border-border rounded-xl p-4 text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Target Timeline *</label>
                    <input
                      type="text"
                      value={formData.target_timeline}
                      onChange={e => updateForm('target_timeline', e.target.value)}
                      placeholder="e.g. In 3 months, By December 2025, Next semester..."
                      className="w-full bg-background/50 border border-border rounded-xl p-4 text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Level */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`flex items-center gap-3 mb-6 ${stepColor}`}>
                    <Zap className="w-6 h-6" />
                    <h2 className="text-2xl font-bold text-foreground">What is your current level?</h2>
                  </div>
                  <div className="flex flex-col gap-4 flex-1">
                    {levels.map(l => (
                      <button
                        key={l}
                        onClick={() => updateForm('current_level', l)}
                        className={`p-5 rounded-xl border text-left transition-all duration-200 ${
                          formData.current_level === l
                            ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] text-foreground'
                            : 'bg-background/40 border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="font-semibold text-base">{l}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {l === 'Beginner' && 'Just starting out or have < 6 months experience'}
                          {l === 'Intermediate' && '6 months to 2 years — know the basics, want to grow'}
                          {l === 'Advanced' && '2+ years — ready to specialize and get hired'}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`flex items-center gap-3 mb-2 ${stepColor}`}>
                    <Code className="w-6 h-6" />
                    <h2 className="text-2xl font-bold text-foreground">Select your existing skills</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">Optional — your AI coach will remember these and build on them.</p>
                  <div className="flex flex-wrap gap-2.5 flex-1">
                    {suggestedSkills.map(skill => {
                      const isSelected = formData.skills.includes(skill)
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                              : 'bg-background/40 border-border text-muted-foreground hover:border-rose-500/40 hover:text-foreground'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                  {formData.skills.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-4">
                      {formData.skills.length} skill{formData.skills.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 5: Time & Intensity */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`flex items-center gap-3 mb-6 ${stepColor}`}>
                    <Clock className="w-6 h-6" />
                    <h2 className="text-2xl font-bold text-foreground">How much time can you commit?</h2>
                  </div>
                  <div className="mb-8">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-sm text-muted-foreground font-medium">Hours per week</span>
                      <span className="font-bold text-amber-400 text-2xl">{formData.available_hours}h</span>
                    </div>
                    <input
                      type="range" min="1" max="40"
                      value={formData.available_hours}
                      onChange={e => updateForm('available_hours', parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1h</span>
                      <span>40h</span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold mb-3 text-foreground">Preferred Intensity *</h3>
                  <div className="flex flex-col gap-3">
                    {intensities.map(i => (
                      <button
                        key={i}
                        onClick={() => updateForm('roadmap_intensity', i)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                          formData.roadmap_intensity === i
                            ? 'bg-amber-500/15 border-amber-500 text-foreground'
                            : 'bg-background/40 border-border hover:border-amber-500/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="font-medium">{i}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 6: Learning Style */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`flex items-center gap-3 mb-6 ${stepColor}`}>
                    <BookOpen className="w-6 h-6" />
                    <h2 className="text-2xl font-bold text-foreground">How do you learn best?</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {styles.map(s => (
                      <button
                        key={s}
                        onClick={() => updateForm('learning_style', s)}
                        className={`p-5 rounded-xl border text-left transition-all duration-200 ${
                          formData.learning_style === s
                            ? 'bg-cyan-500/15 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] text-foreground'
                            : 'bg-background/40 border-border hover:border-cyan-500/40 hover:bg-cyan-500/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="font-medium">{s}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl">
                    <h3 className="font-semibold text-cyan-300 mb-1 flex items-center gap-2">
                      <span>🚀</span> Ready to generate your personalized roadmap?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your AI coach will use everything you've shared to build a fully customized learning path, quests, and milestones just for you.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-8 mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-300 font-medium">Failed to save profile</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{submitError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between border-t border-white/5 pt-6">
            <button
              onClick={goPrev}
              disabled={step === 1 || isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 transition-all font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 font-medium text-sm"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(6,182,212,0.4)] font-bold text-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Saving profile...
                  </>
                ) : (
                  <>Launch My Quest <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
