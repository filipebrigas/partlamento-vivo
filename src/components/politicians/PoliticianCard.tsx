import { User, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, getPartyColor, PARTY_FULL_NAMES } from '@/lib/utils'

interface Politician {
  id: string
  name: string
  party: string
  photo_url: string | null
  parlamento_url: string | null
  times_caught: number
}

interface PoliticianCardProps {
  politician: Politician
  rank?: number
  className?: string
}

export function PoliticianCard({ politician, rank, className }: PoliticianCardProps) {
  const partyColor = getPartyColor(politician.party)

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card overflow-hidden card-hover',
        rank === 1 && 'border-parliament-gold/50 shadow-lg shadow-parliament-gold/10',
        className
      )}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: partyColor }} />

      <div className="p-5">
        {/* Rank badge */}
        {rank !== undefined && rank <= 3 && (
          <div className="absolute top-3 right-3">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              rank === 1 ? 'bg-yellow-500 text-black' :
              rank === 2 ? 'bg-gray-400 text-black' :
              'bg-amber-700 text-white'
            )}>
              {rank}
            </div>
          </div>
        )}

        {/* Photo */}
        <div className="flex justify-center mb-4">
          {politician.photo_url ? (
            <img
              src={politician.photo_url}
              alt={politician.name}
              className="w-20 h-20 rounded-full object-cover border-4 transition-transform group-hover:scale-105"
              style={{ borderColor: partyColor }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 transition-transform group-hover:scale-105"
              style={{ borderColor: partyColor, backgroundColor: `${partyColor}22` }}
            >
              <User className="h-10 w-10" style={{ color: partyColor }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
            {politician.name}
          </h3>
          <Badge
            variant="outline"
            className="text-xs font-bold mb-1"
            style={{ borderColor: partyColor, color: partyColor }}
          >
            {politician.party}
          </Badge>
          {PARTY_FULL_NAMES[politician.party] && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
              {PARTY_FULL_NAMES[politician.party]}
            </p>
          )}
        </div>

        {/* Caught counter */}
        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-center gap-2">
          <Award className="h-4 w-4 text-parliament-gold" />
          <span className="text-sm font-bold text-parliament-gold">
            {politician.times_caught}
          </span>
          <span className="text-xs text-muted-foreground">
            {politician.times_caught === 1 ? 'vez apanhado' : 'vezes apanhado'}
          </span>
        </div>

        {/* Link to parlamento.pt */}
        {politician.parlamento_url && (
          <div className="mt-2 text-center">
            <a
              href={politician.parlamento_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-parliament-gold transition-colors"
            >
              Ver perfil →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
