import { ReactNode } from 'react'
import { logout } from '../auth/actions'
import { LogOut } from 'lucide-react'
import { NavLinks } from './nav-links'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">SkillQuest</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-border">
          <form action={logout}>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        {children}
      </main>
    </div>
  )
}
