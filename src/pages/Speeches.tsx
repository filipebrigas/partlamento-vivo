import { useState, useMemo } from 'react'
import { Search, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { mockSpeeches, mockSessions } from '@/lib/mock-data'
import { segmentTranscript, gradeFillerRate, CATEGORY_COLORS } from '@/lib/filler-words'
import { getPartyColor, cn } from '@/lib/utils'

const PARTIES = ['Todos', 'PS', 'PSD', 'CH', 'IL', 'BE', 'PCP', 'PAN', 'L']

function TranscriptView({ transcript }: { transcript: string }) {
  const segments = segmentTranscript(transcript)
  return (
    <p className="text-sm text-foreground/90 leading-relaxed">
      {segments.map((seg, i) =>
        seg.isFiller ? (
          <mark
            key={i}
            className="rounded px-0.5 font-semibold not-italic"
            style={{
              backgroundColor: `${CATEGORY_COLORS[seg.entry.category]}25`,
              color: CATEGORY_COLORS[seg.entry.category],
            }}
            title={`${seg.entry.category} · ${seg.entry.severity}`}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  )
}

function SpeechCard({ speech }: { speech: typeof mockSpeeches[0] }) {
  const [expanded, setExpanded] = useState(false)
  const grade = gradeFillerRate(speech.filler_word_pct)
  const partyColor = getPartyColor(speech.politician.party)
  const session = mockSessions.find(s => s.id === speech.session_id)
  const durationMin = Math.floor(speech.duration_seconds / 60)
  const durationSec = speech.duration_seconds % 60

  // Top 3 filler words
  const topFillers = Object.entries(speech.filler_occurrences)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden hover:border-parliament-gold/20 transition-colors">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-foreground">{speech.politician.name}</span>
              <Badge variant="outline" className="text-xs" style={{ color: partyColor, borderColor: `${partyColor}44` }}>
                {speech.politician.party}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(speech.started_at).toLocaleDateString('pt-PT')} ·{' '}
                {new Date(speech.started_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {session && (
              <p className="text-xs text-muted-foreground truncate">{session.title}</p>
            )}
          </div>

          {/* Filler badge */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-black" style={{ color: grade.color }}>{speech.filler_word_pct}%</div>
            <div className="text-xs font-medium" style={{ color: grade.color }}>{grade.label}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {durationMin}m {durationSec}s
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {speech.words_per_minute} p/min
          </span>
          <span>{speech.word_count} palavras</span>
          <span className="text-parliament-gold">{speech.filler_word_count} enchimento</span>
        </div>

        {/* Top fillers */}
        {topFillers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {topFillers.map(([word, count]) => (
              <span key={word} className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5 font-medium">
                "{word}" <span className="opacity-70">×{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Transcript toggle */}
      {speech.transcript && (
        <>
          <div className="border-t border-border/60">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              <span>{expanded ? 'Ocultar transcrição' : 'Ver transcrição com enchimento destacado'}</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          {expanded && (
            <div className="px-4 pb-4 bg-background/30">
              <div className="flex gap-3 flex-wrap mb-2 text-[10px] text-muted-foreground">
                <span>Legenda:</span>
                {(['marcador','hesitação','óbvio','vago'] as const).map(cat => (
                  <span key={cat} className="flex items-center gap-1" style={{ color: CATEGORY_COLORS[cat] }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `${CATEGORY_COLORS[cat]}40` }} />
                    {cat}
                  </span>
                ))}
              </div>
              <TranscriptView transcript={speech.transcript} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function Speeches() {
  const [search, setSearch] = useState('')
  const [partyFilter, setPartyFilter] = useState('Todos')
  const [sessionFilter, setSessionFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState<'time' | 'filler_pct' | 'duration'>('time')

  const filtered = useMemo(() => {
    return mockSpeeches
      .filter(s => {
        const matchSearch = !search || s.politician.name.toLowerCase().includes(search.toLowerCase())
        const matchParty = partyFilter === 'Todos' || s.politician.party === partyFilter
        const matchSession = sessionFilter === 'Todos' || s.session_id === sessionFilter
        return matchSearch && matchParty && matchSession
      })
      .sort((a, b) => {
        if (sortBy === 'filler_pct') return b.filler_word_pct - a.filler_word_pct
        if (sortBy === 'duration') return b.duration_seconds - a.duration_seconds
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      })
  }, [search, partyFilter, sessionFilter, sortBy])

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Arquivo de Discursos</h1>
        <p className="text-muted-foreground">
          Todas as intervenções transcritas com palavras de enchimento destacadas.
          <span className="ml-2 text-parliament-gold font-semibold">{mockSpeeches.length} intervenções</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Pesquisar deputado..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50" />
        </div>
        <Select value={partyFilter} onValueChange={setPartyFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-background/50"><SelectValue placeholder="Partido" /></SelectTrigger>
          <SelectContent>{PARTIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-full sm:w-52 bg-background/50"><SelectValue placeholder="Sessão" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as sessões</SelectItem>
            {mockSessions.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-44 bg-background/50"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Mais recentes</SelectItem>
            <SelectItem value="filler_pct">Mais enchimento</SelectItem>
            <SelectItem value="duration">Mais longos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} intervenção{filtered.length !== 1 ? 'ões' : ''}</p>

      <div className="space-y-4">
        {filtered.map(speech => <SpeechCard key={speech.id} speech={speech} />)}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <h3 className="font-semibold text-foreground mb-2">Nenhuma intervenção encontrada</h3>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros.</p>
          </div>
        )}
      </div>
    </div>
  )
}
