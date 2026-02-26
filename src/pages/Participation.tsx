import { useState, useMemo } from 'react'
import { Search, Mic, MicOff, Clock, Award, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { mockPoliticianStats, mockGlobalStats } from '@/lib/mock-data'
import { gradeFillerRate } from '@/lib/filler-words'
import { getPartyColor, cn } from '@/lib/utils'

const PARTIES = ['Todos', 'PS', 'PSD', 'CH', 'IL', 'BE', 'PCP', 'PAN', 'L']

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

function DeputyRow({ politician, rank, view }: {
  politician: typeof mockPoliticianStats[0]
  rank: number
  view: 'speeches' | 'time' | 'filler'
}) {
  const grade = gradeFillerRate(politician.overall_filler_pct)
  const partyColor = getPartyColor(politician.party)
  const isSilent = politician.total_speeches === 0

  const mainMetric = view === 'speeches'
    ? { value: politician.total_speeches.toString(), label: 'intervenções' }
    : view === 'time'
    ? { value: formatSeconds(politician.total_seconds_speaking), label: 'a falar' }
    : { value: `${politician.overall_filler_pct}%`, label: 'enchimento' }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-colors',
      isSilent ? 'border-border/40 bg-card/30 opacity-60' : 'border-border/60 bg-card/60 hover:border-parliament-gold/20'
    )}>
      {/* Rank */}
      <div className={cn(
        'w-7 h-7 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0',
        rank === 1 ? 'bg-yellow-500 text-black' :
        rank === 2 ? 'bg-gray-400 text-black' :
        rank === 3 ? 'bg-amber-700 text-white' :
        'bg-muted text-muted-foreground'
      )}>{rank}</div>

      {/* Mic icon */}
      <div className="flex-shrink-0">
        {isSilent
          ? <MicOff className="h-4 w-4 text-muted-foreground/40" />
          : <Mic className="h-4 w-4 text-parliament-gold" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">{politician.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border flex-shrink-0"
            style={{ color: partyColor, borderColor: `${partyColor}44` }}>{politician.party}</span>
          {isSilent && <span className="text-[10px] text-muted-foreground italic">Sem registo de intervenção</span>}
        </div>
        {!isSilent && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{politician.total_speeches} intervenções</span>
            <span>{formatSeconds(politician.total_seconds_speaking)}</span>
            <span>{politician.avg_words_per_minute} p/min</span>
            {politician.overall_filler_pct > 0 && (
              <span style={{ color: grade.color }}>{politician.overall_filler_pct}% enc. ({grade.label})</span>
            )}
          </div>
        )}
      </div>

      {/* Main metric */}
      {!isSilent && (
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black text-parliament-gold">{mainMetric.value}</div>
          <div className="text-[10px] text-muted-foreground">{mainMetric.label}</div>
        </div>
      )}
    </div>
  )
}

export function Participation() {
  const [search, setSearch] = useState('')
  const [partyFilter, setPartyFilter] = useState('Todos')
  const [view, setView] = useState<'speeches' | 'time' | 'filler'>('speeches')
  const [showSilent, setShowSilent] = useState(true)

  const sorted = useMemo(() => {
    return [...mockPoliticianStats]
      .filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchParty = partyFilter === 'Todos' || p.party === partyFilter
        return matchSearch && matchParty
      })
      .sort((a, b) => {
        if (view === 'filler') return b.overall_filler_pct - a.overall_filler_pct
        if (view === 'time') return b.total_seconds_speaking - a.total_seconds_speaking
        return b.total_speeches - a.total_speeches
      })
  }, [search, partyFilter, view])

  const active = sorted.filter(p => p.total_speeches > 0)
  const silent = sorted.filter(p => p.total_speeches === 0)

  const totalMinutesActive = Math.round(active.reduce((s, p) => s + p.total_seconds_speaking, 0) / 60)

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Participação no Plenário</h1>
        <p className="text-muted-foreground">Quem fala, por quanto tempo e com que qualidade de discurso.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Mic,       value: active.length,             label: 'Deputados ativos' },
          { icon: MicOff,    value: silent.length,             label: 'Sem registo' },
          { icon: Clock,     value: `${totalMinutesActive}min`, label: 'Tempo total' },
          { icon: TrendingUp, value: `${mockGlobalStats.overallFillerPct}%`, label: 'Enchimento médio' },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label} className="bg-card/60">
            <CardContent className="pt-5 flex items-center gap-3">
              <Icon className="h-5 w-5 text-parliament-gold flex-shrink-0" />
              <div>
                <div className="text-xl font-black text-parliament-gold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Participation by party */}
      <Card className="bg-card/60 mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-parliament-gold" />
            Intervenções por Partido
          </CardTitle>
          <CardDescription>Total de discursos registados por grupo parlamentar</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockGlobalStats.participationByParty} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="party" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number, name: string) => [v, name === 'speeches' ? 'intervenções' : 'minutos']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Bar dataKey="speeches" radius={[4, 4, 0, 0]}>
                {mockGlobalStats.participationByParty.map((entry) => (
                  <Cell key={entry.party} fill={getPartyColor(entry.party)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Pesquisar deputado..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50" />
        </div>
        <Select value={partyFilter} onValueChange={setPartyFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-background/50"><SelectValue placeholder="Partido" /></SelectTrigger>
          <SelectContent>{PARTIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-2">
          {(['speeches', 'time', 'filler'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-semibold border transition-colors',
                view === v ? 'bg-parliament-gold text-parliament-blue border-parliament-gold' : 'border-border text-muted-foreground hover:border-parliament-gold/40'
              )}
            >
              {v === 'speeches' ? 'Intervenções' : v === 'time' ? 'Tempo' : 'Enchimento'}
            </button>
          ))}
        </div>
      </div>

      {/* Active deputies */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Deputados com Intervenções ({active.length})
        </h2>
        {active.map((p, idx) => <DeputyRow key={p.id} politician={p} rank={idx + 1} view={view} />)}
      </div>

      {/* Silent deputies */}
      {silent.length > 0 && (
        <div>
          <button
            onClick={() => setShowSilent(!showSilent)}
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <MicOff className="h-4 w-4" />
            Sem Registo de Intervenção ({silent.length})
            <span className="text-xs normal-case font-normal">{showSilent ? '↑ ocultar' : '↓ mostrar'}</span>
          </button>
          {showSilent && (
            <div className="space-y-2">
              {silent.map((p, idx) => <DeputyRow key={p.id} politician={p} rank={active.length + idx + 1} view={view} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
