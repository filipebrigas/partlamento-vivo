import { useState } from 'react'
import { MessageSquare, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { mockGlobalStats, mockPoliticianStats } from '@/lib/mock-data'
import {
  FILLER_WORDS, CATEGORY_LABELS, CATEGORY_COLORS, SEVERITY_COLORS,
  type FillerCategory, gradeFillerRate,
} from '@/lib/filler-words'
import { getPartyColor } from '@/lib/utils'

const CATEGORIES: FillerCategory[] = ['marcador', 'hesitação', 'óbvio', 'vago', 'repetição']

function WordBubble({ word, count, category }: { word: string; count: number; category: string }) {
  const color = CATEGORY_COLORS[category as FillerCategory] ?? '#888'
  const maxCount = mockGlobalStats.top10FillerWords[0]?.count ?? 1
  const size = 0.6 + (count / maxCount) * 0.4

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 border font-medium cursor-default transition-all hover:scale-105"
      style={{
        borderColor: `${color}44`,
        backgroundColor: `${color}15`,
        color,
        fontSize: `${Math.max(0.7, size)}rem`,
        margin: '4px',
      }}
      title={`${count.toLocaleString('pt-PT')} ocorrências — ${category}`}
    >
      {word}
      <span className="opacity-60 text-[10px] ml-1">{count.toLocaleString('pt-PT')}</span>
    </div>
  )
}

export function FillerWords() {
  const [activeCategory, setActiveCategory] = useState<FillerCategory | 'all'>('all')

  const wordsByCat = CATEGORIES.map(cat => ({
    cat,
    words: Object.entries(FILLER_WORDS).filter(([, e]) => e.category === cat),
  }))

  const visibleWords = activeCategory === 'all'
    ? Object.entries(FILLER_WORDS)
    : Object.entries(FILLER_WORDS).filter(([, e]) => e.category === activeCategory)

  const topPerDeputy = [...mockPoliticianStats]
    .filter(p => p.total_speeches > 0)
    .sort((a, b) => b.overall_filler_pct - a.overall_filler_pct)
    .slice(0, 8)

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Palavras de Enchimento</h1>
        <p className="text-muted-foreground max-w-2xl">
          Análise completa das palavras e expressões de enchimento detectadas no discurso parlamentar português.
          Em média, <span className="text-parliament-gold font-bold">{mockGlobalStats.overallFillerPct}%</span> das
          palavras ditas em plenário são de enchimento.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Palavras no catálogo', value: Object.keys(FILLER_WORDS).length },
          { label: 'Total detectadas', value: mockGlobalStats.totalFillerWords.toLocaleString('pt-PT') },
          { label: 'Taxa média global', value: `${mockGlobalStats.overallFillerPct}%` },
          { label: 'Mais usada', value: `"${mockGlobalStats.mostUsedFiller}"` },
        ].map(({ label, value }) => (
          <Card key={label} className="bg-card/60">
            <CardContent className="pt-5">
              <div className="text-2xl font-black text-parliament-gold">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* By category overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Donut / bar by category */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-parliament-gold" />
              Distribuição por Categoria
            </CardTitle>
            <CardDescription>Total de ocorrências detectadas por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockGlobalStats.fillerByCategory} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString('pt-PT'), 'ocorrências']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {mockGlobalStats.fillerByCategory.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as FillerCategory] ?? '#888'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 words */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">Top 10 Palavras</CardTitle>
            <CardDescription>As mais ditas no Plenário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockGlobalStats.top10FillerWords.map((item, idx) => {
                const color = CATEGORY_COLORS[item.category as FillerCategory] ?? '#888'
                const maxCount = mockGlobalStats.top10FillerWords[0].count
                return (
                  <div key={item.word} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-xs text-muted-foreground text-right flex-shrink-0">{idx + 1}</span>
                    <span className="font-mono font-bold flex-shrink-0" style={{ color }}>"{item.word}"</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 w-14 text-right">{item.count.toLocaleString('pt-PT')}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Word cloud / catalog */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-black text-foreground">Catálogo Completo</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCategory === 'all' ? 'bg-parliament-gold text-parliament-blue border-parliament-gold font-bold' : 'border-border text-muted-foreground hover:border-parliament-gold/40'}`}
            >
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeCategory === cat ? 'font-bold' : 'text-muted-foreground hover:border-opacity-60'}`}
                style={activeCategory === cat ? { backgroundColor: `${CATEGORY_COLORS[cat]}20`, color: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] } : { borderColor: `${CATEGORY_COLORS[cat]}40`, color: CATEGORY_COLORS[cat] }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Bubbles */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-5 min-h-[120px]">
          {visibleWords.map(([word, entry]) => {
            const found = mockGlobalStats.top10FillerWords.find(w => w.word === word)
            return <WordBubble key={word} word={word} count={found?.count ?? 0} category={entry.category} />
          })}
        </div>

        {/* Catalog table */}
        <div className="mt-4 rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-card/60">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Palavra/Expressão</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Categoria</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Severidade</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {visibleWords.map(([word, entry]) => (
                <tr key={word} className="border-b border-border/40 hover:bg-card/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold" style={{ color: CATEGORY_COLORS[entry.category] }}>"{word}"</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS[entry.category]}20`, color: CATEGORY_COLORS[entry.category] }}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold" style={{ color: SEVERITY_COLORS[entry.severity] }}>{entry.severity}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deputy filler ranking */}
      <div>
        <h2 className="text-xl font-black text-foreground mb-4">Ranking de Enchimento por Deputado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topPerDeputy.map((p, idx) => {
            const grade = gradeFillerRate(p.overall_filler_pct)
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/60">
                <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-black flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border flex-shrink-0" style={{ color: getPartyColor(p.party), borderColor: `${getPartyColor(p.party)}44` }}>{p.party}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(p.overall_filler_pct, 25) / 25 * 100}%`, backgroundColor: grade.color }} />
                    </div>
                    <span className="text-sm font-black flex-shrink-0" style={{ color: grade.color }}>{p.overall_filler_pct}%</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                  <div>{p.total_filler_words} enc.</div>
                  <div>{p.total_speeches} disc.</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
