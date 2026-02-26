// Supabase Edge Function: scrape-politicians
// Uses Firecrawl to scrape parlamento.pt for the current list of deputies.
// Run manually or on a cron to keep the politicians table up-to-date.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PARLAMENTO_DEPUTIES_URL = 'https://www.parlamento.pt/DeputadoGP/Paginas/Deputados.aspx'

/**
 * Uses Firecrawl to scrape the parlamento.pt deputies page.
 */
async function scrapeParlamentoDeputies(firecrawlKey: string): Promise<Array<{
  name: string
  party: string
  photo_url: string | null
  parlamento_url: string | null
}>> {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: PARLAMENTO_DEPUTIES_URL,
      formats: ['json'],
      jsonOptions: {
        schema: {
          type: 'object',
          properties: {
            deputies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Full name of the deputy' },
                  party: { type: 'string', description: 'Party abbreviation (PS, PSD, CH, etc.)' },
                  photo_url: { type: 'string', description: 'URL to the deputy photo' },
                  profile_url: { type: 'string', description: 'URL to the deputy profile page on parlamento.pt' },
                },
                required: ['name', 'party'],
              },
            },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Firecrawl scrape failed: ${response.status} — ${err}`)
  }

  const result = await response.json()
  const deputies = result?.data?.json?.deputies ?? []
  return deputies.map((d: Record<string, string>) => ({
    name: d.name,
    party: d.party,
    photo_url: d.photo_url ?? null,
    parlamento_url: d.profile_url ?? null,
  }))
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow service-role calls
  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authHeader || !authHeader.includes(serviceKey ?? '')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting parlamento.pt scrape via Firecrawl...')
    const deputies = await scrapeParlamentoDeputies(firecrawlKey)
    console.log(`Scraped ${deputies.length} deputies`)

    if (deputies.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No deputies found — check Firecrawl schema' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert all deputies (by name + party as natural key for now)
    let inserted = 0
    let updated = 0
    const errors: string[] = []

    for (const deputy of deputies) {
      const { data: existing } = await supabase
        .from('politicians')
        .select('id')
        .eq('name', deputy.name)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('politicians')
          .update({
            party: deputy.party,
            photo_url: deputy.photo_url,
            parlamento_url: deputy.parlamento_url,
          })
          .eq('id', existing.id)
        if (error) errors.push(`Update ${deputy.name}: ${error.message}`)
        else updated++
      } else {
        const { error } = await supabase.from('politicians').insert(deputy)
        if (error) errors.push(`Insert ${deputy.name}: ${error.message}`)
        else inserted++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: deputies.length,
        inserted,
        updated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('scrape-politicians error:', error)
    return new Response(
      JSON.stringify({ error: 'Scrape failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
