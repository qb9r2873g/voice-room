import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Database {
  public: {
    Tables: {
      meetings: {
        Row: {
          id: string;
          name: string;
          password_hash: string;
          is_public: boolean;
          max_participants: number;
          host_id: string;
          created_at: string;
          ended_at: string | null;
          status: 'active' | 'ended';
        };
        Insert: {
          id?: string;
          name: string;
          password_hash: string;
          is_public: boolean;
          max_participants: number;
          host_id: string;
          created_at?: string;
          ended_at?: string | null;
          status?: 'active' | 'ended';
        };
        Update: {
          id?: string;
          name?: string;
          password_hash?: string;
          is_public?: boolean;
          max_participants?: number;
          host_id?: string;
          created_at?: string;
          ended_at?: string | null;
          status?: 'active' | 'ended';
        };
      };
      participants: {
        Row: {
          id: string;
          meeting_id: string;
          nickname: string;
          is_host: boolean;
          is_muted: boolean;
          is_connected: boolean;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          nickname: string;
          is_host?: boolean;
          is_muted?: boolean;
          is_connected?: boolean;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          nickname?: string;
          is_host?: boolean;
          is_muted?: boolean;
          is_connected?: boolean;
          joined_at?: string;
          left_at?: string | null;
        };
      };
      signaling: {
        Row: {
          id: string;
          meeting_id: string;
          from_participant: string;
          to_participant: string;
          signal_type: 'offer' | 'answer' | 'ice-candidate';
          signal_data: any;
          created_at: string;
          processed: boolean;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          from_participant: string;
          to_participant: string;
          signal_type: 'offer' | 'answer' | 'ice-candidate';
          signal_data: any;
          created_at?: string;
          processed?: boolean;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          from_participant?: string;
          to_participant?: string;
          signal_type?: 'offer' | 'answer' | 'ice-candidate';
          signal_data?: any;
          created_at?: string;
          processed?: boolean;
        };
      };
    };
  };
}