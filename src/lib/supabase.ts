import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project-id.supabase.co') {
  console.error('Supabase credentials are missing or still using placeholders! Check your .env file');
  console.log('Using localStorage only mode');
}

// Create a dummy client if credentials are missing to prevent crashes
export const supabase = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

// Database types
export interface Database {
  public: {
    Tables: {
      survey_responses: {
        Row: {
          id: string
          activity_id: number
          rating: 'love' | 'neutral' | 'hate'
          user_id: string
          session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_id: number
          rating: 'love' | 'neutral' | 'hate'
          user_id: string
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_id?: number
          rating?: 'love' | 'neutral' | 'hate'
          user_id?: string
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      survey_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          completed_at: string | null
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          completed_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          completed_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
        }
      }
    }
  }
}