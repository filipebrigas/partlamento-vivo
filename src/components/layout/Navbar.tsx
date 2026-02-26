import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Mic, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/ao-vivo',               label: 'Ao Vivo',     badge: 'live' as const },
  { href: '/discursos',             label: 'Discursos',   badge: null },
  { href: '/palavras-de-enchimento',label: 'Enchimento',  badge: null },
  { href: '/participação',          label: 'Participação',badge: null },
  { href: '/comparar',              label: 'Comparar',    badge: null },
  { href: '/estatísticas',          label: 'Estatísticas',badge: null },
  { href: '/documentação',          label: 'Docs',        badge: null },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-parliament-blue group-hover:bg-parliament-blue/90 transition-colors">
            <Mic className="h-5 w-5 text-parliament-gold" />
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="font-bold text-foreground">Parlamento</span>
            <span className="font-bold text-parliament-gold"> em Análise</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                location.pathname === link.href
                  ? 'bg-secondary text-parliament-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {link.label}
              {link.badge === 'live' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            </Link>
          ))}
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="hidden md:flex border-green-500/40 text-green-400 hover:bg-green-500/10">
            <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer">
              <Radio className="h-4 w-4 mr-1.5" />
              ARTV Plenário
            </a>
          </Button>
          <button
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                  location.pathname === link.href ? 'bg-secondary text-parliament-gold' : 'text-muted-foreground hover:text-foreground'
                )}>
                {link.label}
                {link.badge === 'live' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              </Link>
            ))}
            <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer"
              className="mt-2 px-3 py-2 text-sm text-green-400 flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Abrir ARTV Plenário
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
