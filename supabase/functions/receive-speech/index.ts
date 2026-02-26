// Supabase Edge Function: receive-speech
// Receives a transcribed speech segment from the Python AI Worker,
// stores it in the speeches table, and updates session counters.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Filler words catalog (mirrors src/lib/filler-words.ts)
const FILLER_WORDS = [
  'portanto', 'então', 'ora', 'pronto', 'bom', 'pois', 'bem',
  'né', 'tipo', 'digamos', 'sei lá', 'quer dizer', 'ou seja',
  'obviamente', 'claramente', 'evidentemente', 'naturalmente', 'logicamente', 'certamente',
  'de certa forma', 'de alguma forma', 'em termos de', 'ao nível de', 'no fundo',
  'de facto', 'efetivamente', 'basicamente', 'concretamente', 'neste contexto',
  'na prática', 'no âmbito de',
]

function detectFillerWords(text: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const lower = text.toLowerCase()
  const sorted = [...FILLER_WORDS].sort((a, b) => b.length - a.length)
  for (const word of sorted) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = lower.match(regex)
    if (matches?.length) counts[word] = matches.length
  }
  return counts
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Auth: shared secret token
  const authHeader = req.headers.get('Authorization')
  const expectedToken = Deno.env.get('SPEECH_API_SECRET')
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const {
      session_id,
      politician_id,
      started_at,
      ended_at,
      transcript,
      word_count,
      filler_word_count,
      filler_occurrences: provided_occurrences,
      words_per_minute,
      confidence,
      identified_via,
    } = body

    // Validate required fields
    if (!session_id || !politician_id || !started_at) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, politician_id, started_at' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Validate session exists
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', session_id)
      .single()

    if (!session) {
      return new Response(JSON.stringify({ error: `Session not found: ${session_id}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Validate politician exists
    const { data: politician } = await supabase
      .from('politicians')
      .select('id, name, party')
      .eq('id', politician_id)
      .single()

    if (!politician) {
      return new Response(JSON.stringify({ error: `Politician not found: ${politician_id}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Re-compute filler occurrences server-side if transcript provided
    const computedOccurrences = transcript
      ? detectFillerWords(transcript)
      : (provided_occurrences ?? {})

    const computedFillerCount = Object.values(computedOccurrences).reduce((s: number, n) => s + (n as number), 0)
    const finalFillerCount = filler_word_count ?? computedFillerCount
    const finalWordCount = word_count ?? (transcript ? transcript.split(/\s+/).length : 0)

    const fillerPct = finalWordCount > 0
      ? Math.round((finalFillerCount / finalWordCount) * 1000) / 10
      : 0

    // Insert speech record
    const { data: speech, error: insertError } = await supabase
      .from('speeches')
      .insert({
        session_id,
        politician_id,
        started_at,
        ended_at: ended_at ?? null,
        transcript: transcript ?? null,
        word_count: finalWordCount,
        filler_word_count: finalFillerCount,
        words_per_minute: words_per_minute ?? null,
        filler_occurrences: computedOccurrences,
        confidence: confidence ?? null,
        identified_via: identified_via ?? 'face',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Update session aggregate counters
    await supabase.rpc('increment_session_counts', {
      p_session_id: session_id,
      p_words: finalWordCount,
      p_filler_words: finalFillerCount,
    }).catch(console.error) // Non-blocking

    // Stream live transcript event for Realtime subscribers
    await supabase.from('transcript_events').insert({
      speech_id: speech.id,
      session_id,
      politician_id,
      text: transcript ?? '',
      is_filler: finalFillerCount > 0,
      filler_words_found: Object.keys(computedOccurrences),
      timestamp: started_at,
    }).catch(console.error)

    return new Response(
      JSON.stringify({
        success: true,
        speech_id: speech.id,
        filler_pct: fillerPct,
        filler_word_count: finalFillerCount,
        word_count: finalWordCount,
        politician_name: politician.name,
        politician_party: politician.party,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('receive-speech error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
