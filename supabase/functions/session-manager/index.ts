// Supabase Edge Function: session-manager
// Gets or creates a plenário session for a given date.
// Called by the AI Worker at the start of each monitoring run.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLENARIO_STREAM_URL = 'https://canal.parlamento.pt/plenario'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  const secret = Deno.env.get('SPEECH_API_SECRET')
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { date, action, session_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (action === 'get_or_create') {
      const targetDate = date ?? new Date().toISOString().split('T')[0]

      // Check if session already exists for today
      const { data: existing } = await supabase
        .from('sessions')
        .select('id, status, start_time')
        .eq('date', targetDate)
        .maybeSingle()

      if (existing) {
        // Update to active if scheduled
        if (existing.status === 'scheduled') {
          await supabase.from('sessions').update({ status: 'active' }).eq('id', existing.id)
        }
        return new Response(JSON.stringify({ session_id: existing.id, created: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create new session
      const startTime = new Date()
      startTime.setHours(10, 0, 0, 0)

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          date: targetDate,
          stream_url: PLENARIO_STREAM_URL,
          title: `Sessão Plenária — ${new Date(targetDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          start_time: startTime.toISOString(),
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ session_id: session.id, created: true }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'close' && session_id) {
      await supabase.from('sessions').update({
        status: 'completed',
        end_time: new Date().toISOString(),
      }).eq('id', session_id)

      return new Response(JSON.stringify({ success: true, session_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('session-manager error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
