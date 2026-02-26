import { Link } from 'react-router-dom'
import { ExternalLink, Twitter, User, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatTimestamp, getPartyColor } from '@/lib/utils'

interface Detection {
  id: string
  politician: {
    name: string
    party: string
    photo_url: string | null
  }
  timestamp: string
  confidence_score: number
  screenshot_url: string | null
  tweeted: boolean
  tweet_url: string | null
}

interface DetectionCardProps {
  detection: Detection
  className?: string
}

export function DetectionCard({ detection, className }: DetectionCardProps) {
  const partyColor = getPartyColor(detection.politician.party)
  const confidencePct = Math.round(detection.confidence_score * 100)

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card overflow-hidden card-hover cursor-pointer',
        className
      )}
    >
      {/* Thumbnail / placeholder */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {detection.screenshot_url ? (
          <img
            src={detection.screenshot_url}
            alt={`${detection.politician.name} usando telemóvel`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-parliament-blue/30 to-parliament-blue-dark/50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-parliament-blue/40 flex items-center justify-center mb-2">
                <User className="h-8 w-8 text-parliament-gold/60" />
              </div>
              <p className="text-xs text-muted-foreground">Sem imagem</p>
            </div>
          </div>
        )}

        {/* Confidence badge */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            confidencePct >= 90 ? 'bg-green-500/90 text-white' :
            confidencePct >= 75 ? 'bg-yellow-500/90 text-black' :
            'bg-orange-500/90 text-white'
          )}>
            {confidencePct}%
          </span>
        </div>

        {/* Tweeted indicator */}
        {detection.tweeted && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-sky-500/90 text-white">
              <Twitter className="h-3 w-3" />
              Partilhado
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {detection.politician.photo_url ? (
              <img
                src={detection.politician.photo_url}
                alt={detection.politician.name}
                className="w-10 h-10 rounded-full object-cover border-2"
                style={{ borderColor: partyColor }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: partyColor, backgroundColor: `${partyColor}22` }}
              >
                <User className="h-5 w-5" style={{ color: partyColor }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {detection.politician.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs py-0 h-5 font-bold"
                style={{ borderColor: partyColor, color: partyColor }}
              >
                {detection.politician.party}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimestamp(detection.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {detection.tweeted && detection.tweet_url && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <a
              href={detection.tweet_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Twitter className="h-3.5 w-3.5" />
              Ver no X/Twitter
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
