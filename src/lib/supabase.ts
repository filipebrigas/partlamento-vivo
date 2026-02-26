import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      politicians: {
        Row: {
          id: string
          name: string
          party: string
          photo_url: string | null
          parlamento_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          party: string
          photo_url?: string | null
          parlamento_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          party?: string
          photo_url?: string | null
          parlamento_url?: string | null
          created_at?: string
        }
      }
      detections: {
        Row: {
          id: string
          politician_id: string
          timestamp: string
          confidence_score: number
          video_clip_url: string | null
          screenshot_url: string | null
          tweeted: boolean
          tweet_url: string | null
          session_date: string
          created_at: string
        }
        Insert: {
          id?: string
          politician_id: string
          timestamp: string
          confidence_score: number
          video_clip_url?: string | null
          screenshot_url?: string | null
          tweeted?: boolean
          tweet_url?: string | null
          session_date: string
          created_at?: string
        }
        Update: {
          id?: string
          politician_id?: string
          timestamp?: string
          confidence_score?: number
          video_clip_url?: string | null
          screenshot_url?: string | null
          tweeted?: boolean
          tweet_url?: string | null
          session_date?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          date: string
          artv_stream_url: string | null
          start_time: string
          end_time: string | null
          status: 'scheduled' | 'active' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          artv_stream_url?: string | null
          start_time: string
          end_time?: string | null
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          artv_stream_url?: string | null
          start_time?: string
          end_time?: string | null
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
    }
  }
}
