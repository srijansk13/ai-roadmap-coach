import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
          Level Up Your <span className="text-primary">Career</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          SkillQuest AI is your personal growth operating system. 
          Gamified roadmaps, intelligent coaching, and premium analytics to accelerate your learning.
        </p>
        
        <div className="pt-8 flex items-center justify-center gap-4">
          <Link href="/auth/signup" className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            Start Your Quest
          </Link>
          <Link href="/auth/login" className="px-8 py-4 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors border border-border">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
