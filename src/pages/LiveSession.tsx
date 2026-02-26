import { useState, useEffect, useRef } from 'react'
import { Radio, ExternalLink, Mic, MicOff, User, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockLiveEvents, mockSessions, mockPoliticianStats } from '@/lib/mock-data'
import { segmentTranscript, gradeFillerRate, CATEGORY_COLORS } from '@/lib/filler-words'
import { getPartyColor, cn } from '@/lib/utils'

const ARTV_URL = 'https://canal.parlamento.pt/plenario'

function FillerHighlight({ transcript }: { transcript: string }) {
  const segments = segmentTranscript(transcript)
  return (
    <span>
      {segments.map((seg, i) =>
        seg.isFiller ? (
          <mark
            key={i}
            className="rounded px-0.5 font-semibold not-italic"
            style={{
              backgroundColor: `${CATEGORY_COLORS[seg.entry.category]}30`,
              color: CATEGORY_COLORS[seg.entry.category],
            }}
            title={`"${seg.word}" — ${seg.entry.category} (${seg.entry.severity})`}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  )
}

function LiveEventRow({ event, isNew }: { event: typeof mockLiveEvents[0]; isNew?: boolean }) {
  const partyColor = getPartyColor(event.politician.party)
  const hasFiller = event.filler_words_found.length > 0

  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-lg border transition-all duration-500',
      isNew ? 'bg-parliament-gold/5 border-parliament-gold/20' : 'bg-card/40 border-border/40',
      hasFiller && 'border-l-2',
      hasFiller && 'border-l-yellow-500/60'
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{ borderColor: partyColor, backgroundColor: `${partyColor}22` }}>
        <User className="h-4 w-4" style={{ color: partyColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-foreground">{event.politician.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border" style={{ color: partyColor, borderColor: `${partyColor}44` }}>
            {event.politician.party}
          </span>
          {hasFiller && (
            <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
              ⚠ {event.filler_words_found.join(', ')}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {new Date(event.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          <FillerHighlight transcript={event.text} />
        </p>
      </div>
    </div>
  )
}

export function LiveSession() {
  const [events, setEvents] = useState(mockLiveEvents)
  const [newestId, setNewestId] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const activeSession = mockSessions.find(s => s.status === 'active')

  // Simulate incoming events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = {
        ...mockLiveEvents[Math.floor(Math.random() * mockLiveEvents.length)],
        id: `live-${Date.now()}`,
        timestamp: new Date().toISOString(),
      }
      setEvents(prev => [newEvent, ...prev].slice(0, 50))
      setNewestId(newEvent.id)
      setTimeout(() => setNewestId(null), 2000)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Unique speakers in view
  const speakers = [...new Map(events.slice(0, 10).map(e => [e.politician.id, e.politician])).values()]
  const currentSpeaker = events[0]?.politician

  // Live filler rate this session
  const liveFillerWords = events.reduce((s, e) => s + e.filler_words_found.length, 0)
  const liveTotalWords = events.reduce((s, e) => s + e.text.split(' ').length, 0)
  const liveFillerPct = liveTotalWords > 0 ? Math.round((liveFillerWords / liveTotalWords) * 1000) / 10 : 0
  const liveGrade = gradeFillerRate(liveFillerPct)

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Ao Vivo</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">
            {activeSession?.title ?? 'Plenário em Curso'}
          </h1>
          {activeSession && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Iniciou às {new Date(activeSession.start_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
          <a href={ARTV_URL} target="_blank" rel="noopener noreferrer">
            <Radio className="h-4 w-4 mr-2" />
            Abrir Stream ARTV
            <ExternalLink className="h-3.5 w-3.5 ml-2" />
          </a>
        </Button>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2 bg-parliament-blue/10 border border-parliament-blue/30 rounded-xl px-4 py-3 mb-6 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-parliament-gold flex-shrink-0 mt-0.5" />
        <span>
          O stream de vídeo está disponível em{' '}
          <a href={ARTV_URL} target="_blank" rel="noopener noreferrer" className="text-parliament-gold underline hover:no-underline">
            canal.parlamento.pt/plenario
          </a>
          . Esta página mostra a transcrição e análise de enchimento em tempo real do AI Worker.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live transcript feed */}
        <div className="lg:col-span-2 space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Legenda de enchimento:</span>
            {['marcador','hesitação','óbvio','vago'].map(cat => (
              <span key={cat} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: `${CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]}50` }} />
                <span style={{ color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }}>{cat}</span>
              </span>
            ))}
          </div>

          {/* Feed */}
          <div ref={feedRef} className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hide pr-1">
            {events.map((ev) => (
              <LiveEventRow key={ev.id} event={ev} isNew={ev.id === newestId} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Current speaker */}
          <Card className="bg-card/60 border-parliament-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4 text-green-400 animate-pulse" />
                Orador Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSpeaker ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                    style={{ borderColor: getPartyColor(currentSpeaker.party), backgroundColor: `${getPartyColor(currentSpeaker.party)}22` }}>
                    <User className="h-6 w-6" style={{ color: getPartyColor(currentSpeaker.party) }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{currentSpeaker.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5" style={{ color: getPartyColor(currentSpeaker.party), borderColor: `${getPartyColor(currentSpeaker.party)}44` }}>
                      {currentSpeaker.party}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MicOff className="h-4 w-4" />
                  Sem orador identificado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live stats */}
          <Card className="bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-parliament-gold" />
                Estatísticas da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de enchimento</span>
                <span className="font-bold" style={{ color: liveGrade.color }}>{liveFillerPct}% — {liveGrade.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Palavras de enchimento</span>
                <span className="font-bold text-parliament-gold">{liveFillerWords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Palavras totais</span>
                <span className="font-bold text-foreground">{liveTotalWords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intervenções</span>
                <span className="font-bold text-foreground">{events.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Speakers this session */}
          <Card className="bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-parliament-gold" />
                Oradores nesta Sessão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {speakers.map((sp) => {
                  const stats = mockPoliticianStats.find(s => s.id === sp.id)
                  return (
                    <div key={sp.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0"
                        style={{ borderColor: getPartyColor(sp.party), backgroundColor: `${getPartyColor(sp.party)}22` }}>
                        <User className="h-3 w-3" style={{ color: getPartyColor(sp.party) }} />
                      </div>
                      <span className="text-foreground flex-1 truncate text-xs">{sp.name}</span>
                      {stats && stats.total_speeches > 0 && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">{stats.overall_filler_pct}% enc.</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
