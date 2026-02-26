import { Link } from 'react-router-dom'
import { Mic, BarChart2, ChevronRight, Radio, Brain, MessageSquare, Users, TrendingUp, ExternalLink, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockGlobalStats, mockPoliticianStats } from '@/lib/mock-data'
import { getPartyColor } from '@/lib/utils'
import { gradeFillerRate } from '@/lib/filler-words'

function KpiCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-black text-parliament-gold mb-1">{value}</div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, href }: {
  icon: React.ElementType; title: string; description: string; href: string
}) {
  return (
    <Link to={href} className="group block rounded-xl border border-border/60 bg-card/60 p-6 hover:border-parliament-gold/40 hover:bg-card transition-all duration-200">
      <div className="w-10 h-10 rounded-lg bg-parliament-blue/30 flex items-center justify-center mb-4 group-hover:bg-parliament-blue/50 transition-colors">
        <Icon className="h-5 w-5 text-parliament-gold" />
      </div>
      <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-parliament-gold opacity-0 group-hover:opacity-100 transition-opacity">
        Explorar <ChevronRight className="h-3 w-3" />
      </div>
    </Link>
  )
}

export function Landing() {
  const top5 = [...mockPoliticianStats]
    .filter(p => p.total_speeches > 0)
    .sort((a, b) => b.overall_filler_pct - a.overall_filler_pct)
    .slice(0, 5)

  const silentDeputies = mockPoliticianStats.filter(p => p.total_speeches === 0).slice(0, 4)

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,51,153,0.3),transparent)] pointer-events-none" />

        <div className="container relative pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-6 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Sessão em curso · ARTV Plenário ao vivo
            <a href="https://canal.parlamento.pt/plenario" target="_blank" rel="noopener noreferrer"
              className="ml-1 underline hover:text-green-300 transition-colors flex items-center gap-1">
              Ver stream <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-[1.05]">
            <span className="text-foreground">O Parlamento</span>
            <br />
            <span className="text-parliament-gold">em Análise</span>
            <span className="ml-3">🇵🇹</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            Transcrevemos e analisamos cada segundo do Plenário da Assembleia da República —
            quem fala, por quanto tempo, e quantas <strong className="text-foreground">palavras de enchimento</strong> usam.
          </p>

          <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto mb-8">
            Em média, <span className="text-parliament-gold font-bold">{mockGlobalStats.overallFillerPct}%</span> das palavras ditas no Parlamento são de enchimento.
            A mais usada: <span className="text-parliament-gold font-bold italic">"{mockGlobalStats.mostUsedFiller}"</span>{' '}
            ({mockGlobalStats.mostUsedFillerCount.toLocaleString('pt-PT')}x registado).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="bg-parliament-gold text-parliament-blue hover:bg-parliament-gold/90 font-bold shadow-lg shadow-parliament-gold/20" asChild>
              <Link to="/ao-vivo">
                <Radio className="h-5 w-5 mr-2 animate-pulse" />
                Ver Plenário ao Vivo
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border/60" asChild>
              <Link to="/participação">
                <Users className="h-5 w-5 mr-2" />
                Ranking de Participação
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            <KpiCard value={mockGlobalStats.totalSessions} label="Sessões analisadas" />
            <KpiCard value={mockGlobalStats.totalSpeeches} label="Intervenções gravadas" />
            <KpiCard value={`${mockGlobalStats.overallFillerPct}%`} label="Palavras de enchimento" sub="média global" />
            <KpiCard value={`"${mockGlobalStats.mostUsedFiller}"`} label="Palavra mais usada" sub={`${mockGlobalStats.mostUsedFillerCount.toLocaleString('pt-PT')}x`} />
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="container py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-foreground mb-2">O que analisamos</h2>
          <p className="text-sm text-muted-foreground">Cada sessão do Plenário transformada em dados</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Radio} href="/ao-vivo" title="Plenário ao Vivo"
            description="Transcrição em tempo real de canal.parlamento.pt/plenario com identificação automática do orador e destaque instantâneo de palavras de enchimento." />
          <FeatureCard icon={MessageSquare} href="/palavras-de-enchimento" title="Palavras de Enchimento"
            description="Catálogo de 30+ palavras e expressões detectadas automaticamente em português parlamentar. Rankings por palavra, categoria e deputado." />
          <FeatureCard icon={Users} href="/participação" title="Participação"
            description="Quem fala mais? Quem nunca intervém? Ranking completo por deputado e partido, tempo total de palavra e frequência de intervenções." />
          <FeatureCard icon={BarChart2} href="/comparar" title="Comparar Políticos"
            description="Coloca dois deputados lado a lado: taxa de enchimento, velocidade de discurso, tempo de palavra e padrões linguísticos." />
          <FeatureCard icon={Mic} href="/discursos" title="Arquivo de Discursos"
            description="Todas as intervenções transcritas com palavras de enchimento destacadas. Pesquisa por deputado, partido ou sessão." />
          <FeatureCard icon={TrendingUp} href="/estatísticas" title="Estatísticas"
            description="Dashboards: evolução do enchimento ao longo do tempo, por partido, ritmo de discurso, distribuição de participação." />
        </div>
      </section>

      {/* TOP FILLER OFFENDERS */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="container py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-foreground">Mais Palavras de Enchimento</h2>
              <p className="text-sm text-muted-foreground mt-1">Deputados com maior taxa de enchimento no discurso</p>
            </div>
            <Button variant="ghost" size="sm" className="text-parliament-gold" asChild>
              <Link to="/participação">Ver todos <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>

          <div className="space-y-3">
            {top5.map((p, idx) => {
              const grade = gradeFillerRate(p.overall_filler_pct)
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card/60 hover:border-parliament-gold/30 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 bg-muted text-muted-foreground">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground truncate">{p.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold border" style={{ color: getPartyColor(p.party), borderColor: `${getPartyColor(p.party)}44` }}>
                        {p.party}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(p.overall_filler_pct, 25) / 25 * 100}%`, backgroundColor: grade.color }} />
                      </div>
                      <span className="text-sm font-black flex-shrink-0" style={{ color: grade.color }}>{p.overall_filler_pct}%</span>
                      <span className="text-xs flex-shrink-0 font-medium" style={{ color: grade.color }}>{grade.label}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 text-xs text-muted-foreground">{p.total_speeches} intervenções</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SILENT DEPUTIES */}
      {silentDeputies.length > 0 && (
        <section className="container py-10">
          <div className="rounded-xl border border-border/60 bg-card/40 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">Deputados Sem Registo de Intervenção</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Estes deputados ainda não foram identificados a intervir nas sessões monitoradas.</p>
            <div className="flex flex-wrap gap-2">
              {silentDeputies.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5 text-muted-foreground">
                  <span className="font-bold" style={{ color: getPartyColor(p.party) }}>{p.party}</span>
                  {p.name}
                </span>
              ))}
              <Link to="/participação" className="inline-flex items-center gap-1 text-xs text-parliament-gold/70 hover:text-parliament-gold px-3 py-1.5 transition-colors">
                Ver todos →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="container py-14">
          <div className="text-center mb-10">
            <h2 className="text-xl font-black text-foreground mb-2">Como Funciona</h2>
            <p className="text-sm text-muted-foreground">Pipeline automático de análise do Plenário</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, icon: Radio,          title: 'Captura do Stream',       desc: 'Worker Python liga ao HLS de canal.parlamento.pt/plenario durante sessões (seg-sex 10h-17h).' },
              { step: 2, icon: Brain,          title: 'Transcrição Whisper',      desc: 'Áudio segmentado e transcrito com OpenAI Whisper. Cada 30s = um chunk processado em tempo real.' },
              { step: 3, icon: Users,          title: 'Identificação do Orador',  desc: 'Diarização por pyannote.audio + reconhecimento facial identifica o deputado a falar.' },
              { step: 4, icon: MessageSquare,  title: 'Análise de Enchimento',    desc: 'NLP detecta 30+ palavras de enchimento em português e envia tudo à API Supabase.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-parliament-blue/30 border border-parliament-blue/50 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-parliament-gold" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-parliament-gold text-parliament-blue text-[10px] font-black flex items-center justify-center">{step}</div>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" size="sm" className="border-parliament-gold/30 text-parliament-gold" asChild>
              <Link to="/documentação">Documentação técnica completa →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
