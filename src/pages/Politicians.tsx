import { useState, useMemo } from 'react'
import { Search, Trophy, Award } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PoliticianCard } from '@/components/politicians/PoliticianCard'
import { mockPoliticians } from '@/lib/mock-data'
import { cn, getPartyColor } from '@/lib/utils'

const PARTIES = ['Todos', 'PS', 'PSD', 'CH', 'IL', 'BE', 'PCP', 'PAN', 'L']

export function Politicians() {
  const [search, setSearch] = useState('')
  const [partyFilter, setPartyFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState<'times_caught' | 'name'>('times_caught')

  const filtered = useMemo(() => {
    return mockPoliticians
      .filter((p) => {
        const matchSearch =
          !search || p.name.toLowerCase().includes(search.toLowerCase())
        const matchParty = partyFilter === 'Todos' || p.party === partyFilter
        return matchSearch && matchParty
      })
      .sort((a, b) => {
        if (sortBy === 'times_caught') return b.times_caught - a.times_caught
        return a.name.localeCompare(b.name)
      })
  }, [search, partyFilter, sortBy])

  const top3 = [...mockPoliticians]
    .sort((a, b) => b.times_caught - a.times_caught)
    .slice(0, 3)

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Base de Dados de Deputados</h1>
        <p className="text-muted-foreground">
          Os 230 deputados da Assembleia da República — e quantas vezes cada um foi apanhado.
        </p>
      </div>

      {/* Podium / Top 3 */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-parliament-gold" />
          <h2 className="text-lg font-bold text-foreground">Pódio dos Scrollers</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {/* 2nd place */}
          {top3[1] && (
            <div className="mt-8">
              <PoliticianCard politician={top3[1]} rank={2} />
            </div>
          )}
          {/* 1st place */}
          {top3[0] && (
            <div className="-mt-2">
              <div className="text-center mb-2">
                <Award className="h-6 w-6 text-yellow-400 mx-auto" />
              </div>
              <PoliticianCard politician={top3[0]} rank={1} />
            </div>
          )}
          {/* 3rd place */}
          {top3[2] && (
            <div className="mt-12">
              <PoliticianCard politician={top3[2]} rank={3} />
            </div>
          )}
        </div>
      </div>

      {/* Party stats */}
      <div className="mb-10 overflow-x-auto scrollbar-hide">
        <h2 className="text-lg font-bold text-foreground mb-4">Por Partido</h2>
        <div className="flex gap-3 min-w-max pb-2">
          {Object.entries(
            mockPoliticians.reduce<Record<string, { count: number; caught: number }>>((acc, p) => {
              if (!acc[p.party]) acc[p.party] = { count: 0, caught: 0 }
              acc[p.party].count++
              acc[p.party].caught += p.times_caught
              return acc
            }, {})
          )
            .sort(([, a], [, b]) => b.caught - a.caught)
            .map(([party, stats]) => (
              <div
                key={party}
                className="rounded-xl border p-4 text-center min-w-[100px] bg-card/60"
                style={{ borderColor: `${getPartyColor(party)}44` }}
              >
                <div
                  className="text-lg font-black mb-1"
                  style={{ color: getPartyColor(party) }}
                >
                  {party}
                </div>
                <div className="text-2xl font-black text-parliament-gold">{stats.caught}</div>
                <div className="text-xs text-muted-foreground">deteções</div>
                <div className="text-xs text-muted-foreground mt-1">{stats.count} dep.</div>
              </div>
            ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Pesquisar deputado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <Select value={partyFilter} onValueChange={setPartyFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-background/50">
            <SelectValue placeholder="Partido" />
          </SelectTrigger>
          <SelectContent>
            {PARTIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'times_caught' | 'name')}>
          <SelectTrigger className="w-full sm:w-44 bg-background/50">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="times_caught">Mais apanhados</SelectItem>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length} deputado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((politician, idx) => (
          <PoliticianCard
            key={politician.id}
            politician={politician}
            rank={sortBy === 'times_caught' ? idx + 1 : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <h3 className="font-semibold text-foreground mb-2">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros ou pesquisar por outro nome.
          </p>
        </div>
      )}
    </div>
  )
}
