'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Map, User } from 'lucide-react'

export function NavLinks() {
  const pathname = usePathname()

  const links = [
    { name: 'Overview', href: '/dashboard', icon: Home, matchPrefix: false },
    { name: 'Roadmaps', href: '/dashboard/roadmaps', icon: Map, matchPrefix: true },
    { name: 'AI Coach', href: '/dashboard/coach', icon: Compass, matchPrefix: true },
    { name: 'Profile', href: '/dashboard/profile', icon: User, matchPrefix: true },
  ]

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon
        const isActive = link.matchPrefix 
          ? pathname.startsWith(link.href) 
          : pathname === link.href

        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
            {link.name}
          </Link>
        )
      })}
    </>
  )
}
