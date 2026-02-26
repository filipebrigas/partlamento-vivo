import { Link } from 'react-router-dom'
import { Smartphone, Eye, Twitter, ChevronRight, Zap, Camera, Brain, Send, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DetectionCard } from '@/components/detection/DetectionCard'
import { mockDetections, mockStatsData } from '@/lib/mock-data'

function StatCounter({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-black text-parliament-gold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function FlowStep({ icon: Icon, step, title, description }: {
  icon: React.ElementType
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-parliament-blue/30 border border-parliament-blue/50 flex items-center justify-center">
          <Icon className="h-8 w-8 text-parliament-gold" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-parliament-gold text-parliament-blue text-xs font-black flex items-center justify-center">
          {step}
        </div>
      </div>
      <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export function Landing() {
  const latestDetections = mockDetections.slice(0, 4)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 parliament-gradient opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-parliament-blue/20 via-transparent to-transparent pointer-events-none" />

        <div className="container relative pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-parliament-blue/30 border border-parliament-blue/50 rounded-full px-4 py-1.5 mb-6 text-sm text-parliament-gold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Monitorização ativa — sessões de 10h às 17h
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            <span className="text-foreground">Os Scrollers</span>
            <br />
            <span className="text-parliament-gold">do Parlamento</span>
            <span className="ml-3 text-4xl md:text-6xl">🇵🇹📱</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Sistema automático de IA que deteta deputados portugueses a usar telemóveis durante
            as sessões plenárias da Assembleia da República — e partilha no X/Twitter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-parliament-gold text-parliament-blue hover:bg-parliament-gold/90 font-bold shadow-lg shadow-parliament-gold/20"
              asChild
            >
              <Link to="/deteções">
                <Eye className="h-5 w-5 mr-2" />
                Ver Deteções
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border/60" asChild>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5 mr-2" />
                @ParlamentoVivo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="container py-10">
          <div className="grid grid-cols-3 gap-6 md:gap-12">
            <StatCounter value={mockStatsData.totalDetections} label="Deteções totais" />
            <StatCounter value={mockStatsData.totalSessions} label="Sessões monitorizadas" />
            <StatCounter value={mockStatsData.avgPerSession.toFixed(1)} label="Média por sessão" />
          </div>
        </div>
      </section>

      {/* Latest detections */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-foreground">Últimas Deteções</h2>
            <p className="text-sm text-muted-foreground mt-1">Os mais recentes scrollers apanhados</p>
          </div>
          <Button variant="ghost" size="sm" className="text-parliament-gold hover:text-parliament-gold/80" asChild>
            <Link to="/deteções">
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestDetections.map((detection) => (
            <DetectionCard key={detection.id} detection={detection} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="container py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-foreground mb-2">Como Funciona</h2>
            <p className="text-sm text-muted-foreground">Pipeline automático de deteção e publicação</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="absolute top-8 left-1/4 right-1/4 h-px bg-parliament-gold/20 hidden md:block" />

            <FlowStep
              icon={Camera}
              step={1}
              title="Captura de vídeo"
              description="Conexão ao livestream ARTV das 10h às 17h em dias úteis"
            />
            <FlowStep
              icon={Brain}
              step={2}
              title="Deteção por IA"
              description="YOLO deteta telemóveis em frames do vídeo em tempo real"
            />
            <FlowStep
              icon={Zap}
              step={3}
              title="Reconhecimento facial"
              description="Identifica o deputado comparando com a base de dados"
            />
            <FlowStep
              icon={Send}
              step={4}
              title="Publicação automática"
              description="Clip enviado para o X/Twitter com o deputado identificado"
            />
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" size="sm" asChild className="border-parliament-gold/30 text-parliament-gold">
              <Link to="/documentação">
                Documentação técnica
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Inspired by */}
      <section className="container py-10">
        <div className="rounded-xl border border-border/60 bg-card/50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-parliament-gold font-semibold uppercase tracking-wider mb-2">
              Inspiração
            </p>
            <h3 className="text-lg font-bold text-foreground mb-2">
              "The Flemish Scrollers" por Dries Depoorter
            </h3>
            <p className="text-sm text-muted-foreground">
              Este projeto foi inspirado na obra de arte tecnológica do artista belga Dries Depoorter,
              que criou um sistema semelhante para apanhar parlamentares flamengos a usar o telemóvel
              durante as sessões. Adaptámos o conceito para a Assembleia da República Portuguesa.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-parliament-blue/30 border border-parliament-blue/50 flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-parliament-gold" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
