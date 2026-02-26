import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { TrendingUp, MessageSquare, Clock, BarChart2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { mockGlobalStats, mockPoliticianStats } from '@/lib/mock-data'
import { getPartyColor } from '@/lib/utils'
import { gradeFillerRate, CATEGORY_COLORS, CATEGORY_LABELS, type FillerCategory } from '@/lib/filler-words'

const TooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
}

function StatCard({ icon: Icon, title, value, description }: {
  icon: React.ElementType; title: string; value: string | number; description?: string
}) {
  return (
    <Card className="bg-card/60">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-black text-parliament-gold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-parliament-blue/30 flex items-center justify-center">
            <Icon className="h-5 w-5 text-parliament-gold" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Stats() {
  const top5 = [...mockPoliticianStats]
    .filter(p => p.total_speeches > 0)
    .sort((a, b) => b.overall_filler_pct - a.overall_filler_pct)
    .slice(0, 5)

  const top5Speakers = [...mockPoliticianStats]
    .filter(p => p.total_speeches > 0)
    .sort((a, b) => b.total_speeches - a.total_speeches)
    .slice(0, 5)

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Dashboard de Estatísticas</h1>
        <p className="text-muted-foreground">Análise global do discurso parlamentar e das palavras de enchimento.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}        title="Sessões"          value={mockGlobalStats.totalSessions}   description="Plenários monitorizados" />
        <StatCard icon={Mic}          title="Intervenções"     value={mockGlobalStats.totalSpeeches}   description="Discursos transcritos" />
        <StatCard icon={MessageSquare} title="Palavras totais" value={`${(mockGlobalStats.totalWords / 1000).toFixed(0)}k`} description="Ditas em plenário" />
        <StatCard icon={TrendingUp}    title="Taxa enchimento" value={`${mockGlobalStats.overallFillerPct}%`} description="Média global" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Filler trend */}
        <Card className="lg:col-span-2 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-parliament-gold" />
              Taxa de Enchimento ao Longo do Tempo
            </CardTitle>
            <CardDescription>% de palavras de enchimento por sessão semanal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mockGlobalStats.fillerTrend}>
                <defs>
                  <linearGradient id="fillerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A951" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8A951" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'enchimento']} contentStyle={TooltipStyle} />
                <Area type="monotone" dataKey="pct" stroke="#C8A951" strokeWidth={2.5} fill="url(#fillerGrad)" dot={{ fill: '#C8A951', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By category */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-parliament-gold" />
              Por Categoria
            </CardTitle>
            <CardDescription>Distribuição de ocorrências</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={mockGlobalStats.fillerByCategory} dataKey="count" nameKey="category"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {mockGlobalStats.fillerByCategory.map(entry => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as FillerCategory] ?? '#888'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toLocaleString('pt-PT')}`, name]}
                  contentStyle={TooltipStyle}
                />
                <Legend
                  formatter={(v) => <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Filler by party */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-parliament-gold" />
              Taxa de Enchimento por Partido
            </CardTitle>
            <CardDescription>% médio de enchimento por grupo parlamentar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...mockGlobalStats.fillerByParty].sort((a, b) => b.pct - a.pct)} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="party" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'enchimento']} contentStyle={TooltipStyle} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {mockGlobalStats.fillerByParty.map(entry => <Cell key={entry.party} fill={getPartyColor(entry.party)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Speaking time by day */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-parliament-gold" />
              Tempo de Discurso por Dia
            </CardTitle>
            <CardDescription>Minutos totais de intervenções por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockGlobalStats.speakingTimePerDay} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}m`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v} min`, 'discurso']} contentStyle={TooltipStyle} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {mockGlobalStats.speakingTimePerDay.map((entry, i) => (
                    <Cell key={i} fill={entry.day === 'Qua' ? '#C8A951' : '#003399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top filler */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-parliament-gold" />
              Mais Palavras de Enchimento
            </CardTitle>
            <CardDescription>Deputados com maior % de enchimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5.map((p, idx) => {
                const grade = gradeFillerRate(p.overall_filler_pct)
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-black flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-sm font-black flex-shrink-0" style={{ color: grade.color }}>{p.overall_filler_pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(p.overall_filler_pct, 25) / 25 * 100}%`, backgroundColor: grade.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Most active */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-parliament-gold" />
              Mais Participativos
            </CardTitle>
            <CardDescription>Deputados com maior número de intervenções</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5Speakers.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: idx === 0 ? '#EAB308' : idx === 1 ? '#9CA3AF' : idx === 2 ? '#92400E' : 'hsl(var(--muted))', color: idx <= 2 ? '#000' : 'hsl(var(--foreground))' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-[10px] font-bold border rounded px-1 flex-shrink-0"
                          style={{ color: getPartyColor(p.party), borderColor: `${getPartyColor(p.party)}44` }}>{p.party}</span>
                      </div>
                      <span className="text-sm font-black flex-shrink-0 text-parliament-gold">{p.total_speeches}×</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-parliament-blue" style={{ width: `${(p.total_speeches / top5Speakers[0].total_speeches) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Need Mic import
function Mic(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
