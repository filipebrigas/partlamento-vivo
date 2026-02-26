import { useState, useMemo } from 'react'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DetectionCard } from '@/components/detection/DetectionCard'
import { mockDetections, mockPoliticians } from '@/lib/mock-data'

const PARTIES = ['Todos', 'PS', 'PSD', 'CH', 'IL', 'BE', 'PCP', 'PAN', 'L', 'CDS-PP']

export function Detections() {
  const [search, setSearch] = useState('')
  const [partyFilter, setPartyFilter] = useState('Todos')
  const [politicianFilter, setPoliticianFilter] = useState('Todos')
  const [tweetedFilter, setTweetedFilter] = useState('Todos')

  const filtered = useMemo(() => {
    return mockDetections.filter((d) => {
      const matchSearch =
        !search ||
        d.politician.name.toLowerCase().includes(search.toLowerCase()) ||
        d.politician.party.toLowerCase().includes(search.toLowerCase())
      const matchParty = partyFilter === 'Todos' || d.politician.party === partyFilter
      const matchPolitician =
        politicianFilter === 'Todos' || d.politician_id === politicianFilter
      const matchTweeted =
        tweetedFilter === 'Todos' ||
        (tweetedFilter === 'Sim' ? d.tweeted : !d.tweeted)
      return matchSearch && matchParty && matchPolitician && matchTweeted
    })
  }, [search, partyFilter, politicianFilter, tweetedFilter])

  const resetFilters = () => {
    setSearch('')
    setPartyFilter('Todos')
    setPoliticianFilter('Todos')
    setTweetedFilter('Todos')
  }

  const hasActiveFilters =
    search !== '' ||
    partyFilter !== 'Todos' ||
    politicianFilter !== 'Todos' ||
    tweetedFilter !== 'Todos'

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Feed de Deteções</h1>
        <p className="text-muted-foreground">
          Todos os momentos em que deputados foram apanhados a usar telemóvel.
          <span className="ml-2 text-parliament-gold font-semibold">
            {mockDetections.length} deteções totais
          </span>
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card/60 border border-border/60 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="h-4 w-4 text-parliament-gold" />
          <span className="text-sm font-semibold text-foreground">Filtros</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground h-7"
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Pesquisar deputado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>

          {/* Party filter */}
          <Select value={partyFilter} onValueChange={setPartyFilter}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Partido" />
            </SelectTrigger>
            <SelectContent>
              {PARTIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Politician filter */}
          <Select value={politicianFilter} onValueChange={setPoliticianFilter}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Deputado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os deputados</SelectItem>
              {mockPoliticians.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tweeted filter */}
          <Select value={tweetedFilter} onValueChange={setTweetedFilter}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Publicado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Sim">Publicado no X</SelectItem>
              <SelectItem value="Não">Não publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            <Filter className="inline h-3.5 w-3.5 mr-1" />
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((detection) => (
              <DetectionCard key={detection.id} detection={detection} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tente ajustar os filtros ou pesquisar por outro termo.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
