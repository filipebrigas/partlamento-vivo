import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, Award, Calendar, BarChart2, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { mockStatsData, mockPoliticians } from '@/lib/mock-data'
import { getPartyColor } from '@/lib/utils'

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ElementType
  title: string
  value: string | number
  description?: string
}) {
  return (
    <Card className="bg-card/60">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-black text-parliament-gold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-parliament-blue/30 flex items-center justify-center">
            <Icon className="h-5 w-5 text-parliament-gold" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-parliament-gold">{payload[0].value} deteções</p>
      </div>
    )
  }
  return null
}

export function Stats() {
  const topOffenders = [...mockPoliticians]
    .sort((a, b) => b.times_caught - a.times_caught)
    .slice(0, 5)

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Dashboard de Estatísticas</h1>
        <p className="text-muted-foreground">
          Análise detalhada das deteções de uso de telemóvel nas sessões parlamentares.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Smartphone}
          title="Total de Deteções"
          value={mockStatsData.totalDetections}
          description="Desde o início da monitorização"
        />
        <StatCard
          icon={Calendar}
          title="Sessões Monitorizadas"
          value={mockStatsData.totalSessions}
          description="Dias com parlamento em sessão"
        />
        <StatCard
          icon={TrendingUp}
          title="Média por Sessão"
          value={mockStatsData.avgPerSession.toFixed(1)}
          description="Deteções por dia de sessão"
        />
        <StatCard
          icon={Award}
          title="Pior Infrator"
          value={topOffenders[0]?.name.split(' ').pop() ?? '—'}
          description={`${topOffenders[0]?.times_caught ?? 0} vezes apanhado`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Detections over time */}
        <Card className="lg:col-span-2 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-parliament-gold" />
              Deteções ao Longo do Tempo
            </CardTitle>
            <CardDescription>Evolução semanal das deteções</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mockStatsData.detectionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#C8A951"
                  strokeWidth={2.5}
                  dot={{ fill: '#C8A951', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By party pie */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-parliament-gold" />
              Por Partido
            </CardTitle>
            <CardDescription>Distribuição das deteções</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={mockStatsData.detectionsByParty}
                  dataKey="count"
                  nameKey="party"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {mockStatsData.detectionsByParty.map((entry) => (
                    <Cell key={entry.party} fill={getPartyColor(entry.party)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} deteções`, name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By day of week */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-parliament-gold" />
              Por Dia da Semana
            </CardTitle>
            <CardDescription>Em que dia há mais distrações</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockStatsData.detectionsByDayOfWeek} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#003399" radius={[4, 4, 0, 0]}>
                  {mockStatsData.detectionsByDayOfWeek.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 2 ? '#C8A951' : '#003399'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Worst offenders */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-parliament-gold" />
              Piores Infratores
            </CardTitle>
            <CardDescription>Os 5 deputados mais apanhados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {topOffenders.map((politician, idx) => (
                <div key={politician.id} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                      backgroundColor:
                        idx === 0 ? '#EAB308' :
                        idx === 1 ? '#9CA3AF' :
                        idx === 2 ? '#92400E' :
                        'hsl(var(--muted))',
                      color: idx <= 2 ? '#000' : 'hsl(var(--foreground))',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {politician.name}
                      </span>
                      <span className="text-sm font-black text-parliament-gold flex-shrink-0">
                        {politician.times_caught}x
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(politician.times_caught / topOffenders[0].times_caught) * 100}%`,
                          backgroundColor: getPartyColor(politician.party),
                        }}
                      />
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
