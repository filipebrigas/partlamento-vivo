import { useState } from 'react'
import { BarChart2, Clock, TrendingUp, MessageSquare, Mic, User } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { mockPoliticianStats, mockSpeeches } from '@/lib/mock-data'
import { gradeFillerRate, FILLER_WORDS, CATEGORY_COLORS, type FillerCategory } from '@/lib/filler-words'
import { getPartyColor, cn } from '@/lib/utils'

function formatSeconds(s: number) {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

function StatRow({ label, a, b, higherIsBetter = true }: {
  label: string
  a: { value: string | number; raw: number }
  b: { value: string | number; raw: number }
  higherIsBetter?: boolean
}) {
  const aWins = higherIsBetter ? a.raw >= b.raw : a.raw <= b.raw
  const bWins = higherIsBetter ? b.raw >= a.raw : b.raw <= a.raw
  const tie = a.raw === b.raw

  return (
    <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-border/40 last:border-0 text-sm">
      <div className={cn('font-bold text-right', !tie && aWins ? 'text-parliament-gold' : 'text-foreground')}>
        {a.value}
        {!tie && aWins && <span className="ml-1 text-parliament-gold text-xs">✓</span>}
      </div>
      <div className="text-center text-xs text-muted-foreground self-center">{label}</div>
      <div className={cn('font-bold text-left', !tie && bWins ? 'text-parliament-gold' : 'text-foreground')}>
        {!tie && bWins && <span className="mr-1 text-parliament-gold text-xs">✓</span>}
        {b.value}
      </div>
    </div>
  )
}

function TopFillersList({ politicianId }: { politicianId: string }) {
  const speeches = mockSpeeches.filter(s => s.politician_id === politicianId)
  const combined: Record<string, number> = {}
  speeches.forEach(s => {
    Object.entries(s.filler_occurrences).forEach(([w, c]) => {
      combined[w] = (combined[w] ?? 0) + c
    })
  })
  const sorted = Object.entries(combined).sort(([, a], [, b]) => b - a).slice(0, 6)

  if (sorted.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Sem registo suficiente</p>
  }

  return (
    <div className="space-y-1.5">
      {sorted.map(([word, count]) => {
        const entry = FILLER_WORDS[word]
        const color = entry ? CATEGORY_COLORS[entry.category] : '#888'
        return (
          <div key={word} className="flex items-center gap-2 text-xs">
            <span className="font-mono font-bold flex-shrink-0" style={{ color }}>"{word}"</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(count / sorted[0][1], 1) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="text-muted-foreground w-6 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export function Compare() {
  const [idA, setIdA] = useState(mockPoliticianStats[0]?.id ?? '')
  const [idB, setIdB] = useState(mockPoliticianStats[2]?.id ?? '')

  const polA = mockPoliticianStats.find(p => p.id === idA)
  const polB = mockPoliticianStats.find(p => p.id === idB)

  const gradeA = polA ? gradeFillerRate(polA.overall_filler_pct) : null
  const gradeB = polB ? gradeFillerRate(polB.overall_filler_pct) : null

  // Radar data (normalized 0-100, some inverted)
  const radarData = polA && polB ? [
    { metric: 'Intervenções',   A: Math.min(polA.total_speeches / 10 * 100, 100),               B: Math.min(polB.total_speeches / 10 * 100, 100) },
    { metric: 'Tempo',          A: Math.min(polA.total_seconds_speaking / 5000 * 100, 100),      B: Math.min(polB.total_seconds_speaking / 5000 * 100, 100) },
    { metric: 'Velocidade',     A: Math.min(polA.avg_words_per_minute / 200 * 100, 100),         B: Math.min(polB.avg_words_per_minute / 200 * 100, 100) },
    { metric: 'Clareza',        A: Math.max(0, 100 - polA.overall_filler_pct * 4),               B: Math.max(0, 100 - polB.overall_filler_pct * 4) },
    { metric: 'Palavras',       A: Math.min(polA.total_words / 2000 * 100, 100),                 B: Math.min(polB.total_words / 2000 * 100, 100) },
  ] : []

  const colorA = polA ? getPartyColor(polA.party) : '#C8A951'
  const colorB = polB ? getPartyColor(polB.party) : '#003399'

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Comparar Deputados</h1>
        <p className="text-muted-foreground">Analisa lado a lado o perfil discursivo de dois deputados.</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Deputado A</label>
          <Select value={idA} onValueChange={v => { if (v !== idB) setIdA(v) }}>
            <SelectTrigger className="bg-card border-parliament-gold/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockPoliticianStats.map(p => (
                <SelectItem key={p.id} value={p.id} disabled={p.id === idB}>
                  {p.name} ({p.party})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Deputado B</label>
          <Select value={idB} onValueChange={v => { if (v !== idA) setIdB(v) }}>
            <SelectTrigger className="bg-card border-parliament-blue/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockPoliticianStats.map(p => (
                <SelectItem key={p.id} value={p.id} disabled={p.id === idA}>
                  {p.name} ({p.party})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {polA && polB && (
        <>
          {/* Name cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { p: polA, grade: gradeA!, color: colorA },
              { p: polB, grade: gradeB!, color: colorB },
            ].map(({ p, grade, color }) => (
              <Card key={p.id} className="bg-card/60" style={{ borderColor: `${color}30` }}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border-2" style={{ borderColor: color, backgroundColor: `${color}22` }}>
                      <User className="h-6 w-6" style={{ color }} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm leading-tight">{p.name}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded border font-bold" style={{ color, borderColor: `${color}44` }}>{p.party}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-black mb-1" style={{ color: grade.color }}>{p.overall_filler_pct}%</div>
                  <div className="text-sm font-medium" style={{ color: grade.color }}>{grade.label}</div>
                  <div className="text-xs text-muted-foreground">taxa de enchimento</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar + Stats side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Radar */}
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-parliament-gold" />
                  Perfil Comparativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Radar name={polA.name} dataKey="A" stroke={colorA} fill={colorA} fillOpacity={0.2} />
                    <Radar name={polB.name} dataKey="B" stroke={colorB} fill={colorB} fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: colorA }} />{polA.name.split(' ')[0]}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: colorB }} />{polB.name.split(' ')[0]}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats comparison */}
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-sm">Estatísticas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <StatRow label="Intervenções" a={{ value: polA.total_speeches, raw: polA.total_speeches }} b={{ value: polB.total_speeches, raw: polB.total_speeches }} />
                <StatRow label="Tempo total" a={{ value: formatSeconds(polA.total_seconds_speaking), raw: polA.total_seconds_speaking }} b={{ value: formatSeconds(polB.total_seconds_speaking), raw: polB.total_seconds_speaking }} />
                <StatRow label="Palavras totais" a={{ value: polA.total_words.toLocaleString('pt-PT'), raw: polA.total_words }} b={{ value: polB.total_words.toLocaleString('pt-PT'), raw: polB.total_words }} />
                <StatRow label="Velocidade (p/min)" a={{ value: polA.avg_words_per_minute, raw: polA.avg_words_per_minute }} b={{ value: polB.avg_words_per_minute, raw: polB.avg_words_per_minute }} />
                <StatRow label="Taxa de enchimento" higherIsBetter={false}
                  a={{ value: `${polA.overall_filler_pct}%`, raw: polA.overall_filler_pct }}
                  b={{ value: `${polB.overall_filler_pct}%`, raw: polB.overall_filler_pct }}
                />
                <StatRow label="Total enchimento" higherIsBetter={false}
                  a={{ value: polA.total_filler_words, raw: polA.total_filler_words }}
                  b={{ value: polB.total_filler_words, raw: polB.total_filler_words }}
                />
                <StatRow label="Sessões" a={{ value: polA.sessions_participated, raw: polA.sessions_participated }} b={{ value: polB.sessions_participated, raw: polB.sessions_participated }} />
              </CardContent>
            </Card>
          </div>

          {/* Top filler words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{ p: polA, color: colorA }, { p: polB, color: colorB }].map(({ p, color }) => (
              <Card key={p.id} className="bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color }} />
                    Palavras de Enchimento de {p.name.split(' ')[0]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopFillersList politicianId={p.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
