// Supabase Edge Function: post-to-twitter
// Fetches a detection and posts a clip/screenshot to X/Twitter.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Build the tweet text for a detection.
 */
function buildTweetText(politician: { name: string; party: string }, timestamp: string): string {
  const date = new Date(timestamp)
  const timeStr = date.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  })
  const dateStr = date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Lisbon',
  })

  return [
    `📱 ${politician.name} (${politician.party}) apanhado a usar o telemóvel durante a sessão plenária!`,
    ``,
    `🕐 ${timeStr} — ${dateStr}`,
    ``,
    `#Parlamento #AssembleiaRepublica #Portugal #ScrollersDosParlamento`,
  ].join('\n')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { detection_id } = await req.json()

    if (!detection_id) {
      return new Response(
        JSON.stringify({ error: 'Missing detection_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch detection with politician info
    const { data: detection, error } = await supabase
      .from('detections_with_politicians')
      .select('*')
      .eq('id', detection_id)
      .single()

    if (error || !detection) {
      return new Response(
        JSON.stringify({ error: `Detection not found: ${detection_id}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (detection.tweeted) {
      return new Response(
        JSON.stringify({ tweeted: true, tweet_url: detection.tweet_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build tweet text
    const tweetText = buildTweetText(
      { name: detection.politician_name, party: detection.politician_party },
      detection.timestamp
    )

    // X/Twitter API v2
    const twitterApiKey = Deno.env.get('TWITTER_API_KEY')
    const twitterApiSecret = Deno.env.get('TWITTER_API_SECRET')
    const twitterAccessToken = Deno.env.get('TWITTER_ACCESS_TOKEN')
    const twitterAccessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')

    if (!twitterApiKey || !twitterApiSecret || !twitterAccessToken || !twitterAccessTokenSecret) {
      console.warn('Twitter credentials not configured — skipping tweet')
      return new Response(
        JSON.stringify({ tweeted: false, tweet_url: null, reason: 'Twitter credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OAuth 1.0a signing helper (Twitter API v2 still supports it)
    const oauthHeader = await buildOAuthHeader(
      'POST',
      'https://api.twitter.com/2/tweets',
      {},
      {
        oauth_consumer_key: twitterApiKey,
        oauth_token: twitterAccessToken,
        oauth_consumer_secret: twitterApiSecret,
        oauth_token_secret: twitterAccessTokenSecret,
      }
    )

    const tweetPayload: Record<string, unknown> = { text: tweetText }

    // Attach media if screenshot is available
    if (detection.screenshot_url) {
      try {
        const mediaId = await uploadMediaToTwitter(
          detection.screenshot_url,
          { twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessTokenSecret }
        )
        if (mediaId) {
          tweetPayload.media = { media_ids: [mediaId] }
        }
      } catch (mediaErr) {
        console.error('Media upload failed, posting text-only:', mediaErr)
      }
    }

    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: oauthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetPayload),
    })

    if (!tweetResponse.ok) {
      const errBody = await tweetResponse.text()
      throw new Error(`Twitter API error ${tweetResponse.status}: ${errBody}`)
    }

    const tweetData = await tweetResponse.json()
    const tweetId = tweetData?.data?.id
    const tweetUrl = tweetId
      ? `https://x.com/ParlamentoVivo/status/${tweetId}`
      : null

    // Update detection record
    await supabase
      .from('detections')
      .update({ tweeted: true, tweet_url: tweetUrl })
      .eq('id', detection_id)

    return new Response(
      JSON.stringify({ tweeted: true, tweet_url: tweetUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('post-to-twitter error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ---------------------------------------------------------------------------
// OAuth 1.0a helpers (minimal implementation for Deno/Edge)
// ---------------------------------------------------------------------------
async function buildOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  credentials: {
    oauth_consumer_key: string
    oauth_token: string
    oauth_consumer_secret: string
    oauth_token_secret: string
  }
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.oauth_consumer_key,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.oauth_token,
    oauth_version: '1.0',
  }

  const allParams = { ...params, ...oauthParams }
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join('&')

  const signingKey = `${encodeURIComponent(credentials.oauth_consumer_secret)}&${encodeURIComponent(credentials.oauth_token_secret)}`

  const keyData = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    keyData,
    new TextEncoder().encode(baseString)
  )
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  oauthParams.oauth_signature = signature

  const headerValue = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')

  return headerValue
}

async function uploadMediaToTwitter(
  imageUrl: string,
  credentials: {
    twitterApiKey: string
    twitterApiSecret: string
    twitterAccessToken: string
    twitterAccessTokenSecret: string
  }
): Promise<string | null> {
  // Fetch the image
  const imgResponse = await fetch(imageUrl)
  if (!imgResponse.ok) return null
  const imgBuffer = await imgResponse.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)))

  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'
  const oauthHeader = await buildOAuthHeader('POST', uploadUrl, {}, {
    oauth_consumer_key: credentials.twitterApiKey,
    oauth_token: credentials.twitterAccessToken,
    oauth_consumer_secret: credentials.twitterApiSecret,
    oauth_token_secret: credentials.twitterAccessTokenSecret,
  })

  const formData = new FormData()
  formData.append('media_data', base64)

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: oauthHeader },
    body: formData,
  })

  if (!res.ok) return null
  const data = await res.json()
  return data?.media_id_string ?? null
}
