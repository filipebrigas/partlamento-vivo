// Supabase Edge Function: receive-detection
// Called by the external Python AI worker to submit a new phone-usage detection.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Authenticate the AI worker using a shared secret token
  const authHeader = req.headers.get('Authorization')
  const expectedToken = Deno.env.get('DETECTION_API_SECRET')

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const {
      politician_id,
      timestamp,
      confidence_score,
      video_clip_url,
      screenshot_url,
      session_date,
    } = body

    // Validate required fields
    if (!politician_id || !timestamp || confidence_score === undefined || !session_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: politician_id, timestamp, confidence_score, session_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (confidence_score < 0 || confidence_score > 1) {
      return new Response(
        JSON.stringify({ error: 'confidence_score must be between 0 and 1' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify politician exists
    const { data: politician, error: polError } = await supabase
      .from('politicians')
      .select('id, name, party')
      .eq('id', politician_id)
      .single()

    if (polError || !politician) {
      return new Response(
        JSON.stringify({ error: `Politician not found: ${politician_id}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert detection
    const { data: detection, error: insertError } = await supabase
      .from('detections')
      .insert({
        politician_id,
        timestamp,
        confidence_score,
        video_clip_url: video_clip_url ?? null,
        screenshot_url: screenshot_url ?? null,
        session_date,
        tweeted: false,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Trigger the post-to-twitter function asynchronously
    let tweetResult = { tweeted: false, tweet_url: null as string | null }
    try {
      const tweetResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/post-to-twitter`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ detection_id: detection.id }),
        }
      )
      if (tweetResponse.ok) {
        tweetResult = await tweetResponse.json()
      }
    } catch (tweetError) {
      console.error('Failed to post to Twitter:', tweetError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        detection_id: detection.id,
        politician: { name: politician.name, party: politician.party },
        tweeted: tweetResult.tweeted,
        tweet_url: tweetResult.tweet_url,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('receive-detection error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
