export type FillerCategory = 'marcador' | 'hesitação' | 'óbvio' | 'vago' | 'repetição'
export type FillerSeverity = 'low' | 'medium' | 'high'

export interface FillerWordEntry {
  category: FillerCategory
  severity: FillerSeverity
  description: string
}

export const FILLER_WORDS: Record<string, FillerWordEntry> = {
  // Marcadores de discurso
  'portanto':       { category: 'marcador',   severity: 'high',   description: 'Marcador de conclusão muito frequente' },
  'então':          { category: 'marcador',   severity: 'medium', description: 'Marcador de sequência temporal ou lógica' },
  'ora':            { category: 'marcador',   severity: 'medium', description: 'Marcador de introdução ou contraste' },
  'pronto':         { category: 'marcador',   severity: 'medium', description: 'Marcador de conclusão ou aceitação' },
  'bom':            { category: 'marcador',   severity: 'low',    description: 'Marcador de hesitação ou introdução' },
  'pois':           { category: 'marcador',   severity: 'low',    description: 'Marcador de concordância' },
  'bem':            { category: 'marcador',   severity: 'low',    description: 'Marcador de transição' },
  // Hesitação
  'né':             { category: 'hesitação',  severity: 'high',   description: 'Partícula de confirmação informal' },
  'tipo':           { category: 'hesitação',  severity: 'high',   description: 'Marcador de aproximação informal' },
  'digamos':        { category: 'hesitação',  severity: 'medium', description: 'Expressão de aproximação' },
  'sei lá':         { category: 'hesitação',  severity: 'high',   description: 'Expressão de incerteza' },
  'quer dizer':     { category: 'hesitação',  severity: 'medium', description: 'Reformulação ou esclarecimento' },
  'ou seja':        { category: 'hesitação',  severity: 'low',    description: 'Reformulação frequentemente vazia' },
  // Óbvio / Redundante
  'obviamente':     { category: 'óbvio',      severity: 'medium', description: 'Afirmação de evidência desnecessária' },
  'claramente':     { category: 'óbvio',      severity: 'medium', description: 'Afirmação de clareza desnecessária' },
  'evidentemente':  { category: 'óbvio',      severity: 'medium', description: 'Afirmação de evidência' },
  'naturalmente':   { category: 'óbvio',      severity: 'low',    description: 'Afirmação de naturalidade' },
  'logicamente':    { category: 'óbvio',      severity: 'low',    description: 'Afirmação de lógica presumida' },
  'certamente':     { category: 'óbvio',      severity: 'low',    description: 'Afirmação de certeza' },
  // Vago / Evasivo
  'de certa forma': { category: 'vago',        severity: 'high',   description: 'Aproximação vaga muito usada' },
  'de alguma forma':{ category: 'vago',        severity: 'high',   description: 'Aproximação muito vaga' },
  'em termos de':   { category: 'vago',        severity: 'medium', description: 'Relação imprecisa' },
  'ao nível de':    { category: 'vago',        severity: 'medium', description: 'Localização vaga e burocrática' },
  'no fundo':       { category: 'vago',        severity: 'medium', description: 'Essencialização vaga' },
  'de facto':       { category: 'vago',        severity: 'low',    description: 'Ênfase frequentemente desnecessária' },
  'efetivamente':   { category: 'vago',        severity: 'low',    description: 'Confirmação redundante' },
  'basicamente':    { category: 'vago',        severity: 'medium', description: 'Simplificação frequentemente enganosa' },
  'concretamente':  { category: 'vago',        severity: 'low',    description: 'Promessa de concretização' },
  'neste contexto': { category: 'vago',        severity: 'low',    description: 'Referência contextual desnecessária' },
  'na prática':     { category: 'vago',        severity: 'low',    description: 'Distinção artificial teoria/prática' },
  'no âmbito de':   { category: 'vago',        severity: 'medium', description: 'Enquadramento vago e burocrático' },
}

export const FILLER_WORD_LIST = Object.keys(FILLER_WORDS)

export const CATEGORY_LABELS: Record<FillerCategory, string> = {
  'marcador':   'Marcador de Discurso',
  'hesitação':  'Hesitação',
  'óbvio':      'Declaração Óbvia',
  'vago':       'Linguagem Vaga',
  'repetição':  'Repetição Protocolar',
}

export const CATEGORY_COLORS: Record<FillerCategory, string> = {
  'marcador':   '#F59E0B',
  'hesitação':  '#EF4444',
  'óbvio':      '#8B5CF6',
  'vago':       '#3B82F6',
  'repetição':  '#6B7280',
}

export const SEVERITY_COLORS: Record<FillerSeverity, string> = {
  'high':   '#EF4444',
  'medium': '#F59E0B',
  'low':    '#22C55E',
}

/**
 * Highlights filler words in a transcript string by wrapping them in <mark> tags.
 * Returns an array of {text, isFiller, word} segments for rendering.
 */
export type TranscriptSegment = { text: string; isFiller: false } | { text: string; isFiller: true; word: string; entry: FillerWordEntry }

export function segmentTranscript(transcript: string): TranscriptSegment[] {
  if (!transcript) return []

  // Build a regex that matches any filler word/phrase (longest first to avoid partial matches)
  const sorted = FILLER_WORD_LIST.sort((a, b) => b.length - a.length)
  const pattern = sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi')

  const segments: TranscriptSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(transcript)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: transcript.slice(lastIndex, match.index), isFiller: false })
    }
    const word = match[0].toLowerCase()
    const entry = FILLER_WORDS[word] ?? FILLER_WORDS[Object.keys(FILLER_WORDS).find(k => k.toLowerCase() === word) ?? '']
    segments.push({ text: match[0], isFiller: true, word, entry: entry ?? { category: 'marcador', severity: 'low', description: '' } })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < transcript.length) {
    segments.push({ text: transcript.slice(lastIndex), isFiller: false })
  }

  return segments
}

/**
 * Count filler word occurrences in a transcript.
 */
export function countFillerWords(transcript: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const sorted = FILLER_WORD_LIST.sort((a, b) => b.length - a.length)
  const pattern = sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi')

  let match: RegExpExecArray | null
  while ((match = regex.exec(transcript)) !== null) {
    const word = match[0].toLowerCase()
    counts[word] = (counts[word] ?? 0) + 1
  }
  return counts
}

export function fillerPercentage(fillerCount: number, totalWords: number): number {
  if (totalWords === 0) return 0
  return Math.round((fillerCount / totalWords) * 1000) / 10
}

export function gradeFillerRate(pct: number): { label: string; color: string } {
  if (pct <= 3) return { label: 'Excelente', color: '#22C55E' }
  if (pct <= 7) return { label: 'Bom', color: '#84CC16' }
  if (pct <= 12) return { label: 'Aceitável', color: '#F59E0B' }
  if (pct <= 20) return { label: 'Preocupante', color: '#EF4444' }
  return { label: 'Crítico', color: '#DC2626' }
}
