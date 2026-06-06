import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fzcqibexnuhtdavsbpmh.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y3FpYmV4bnVodGRhdnNicG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNzUsImV4cCI6MjA5NjExODI3NX0.o2ktlkWm-2aPiAR93TtOBDPxGu25HtG8-uRbfDlrBPw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type FocusItem = {
  id: string;
  content: string;
  mode: 'personal' | 'work';
  position: number;
  completed: boolean;
  created_at: string;
};

export type BacklogItem = {
  id: string;
  content: string;
  mode: 'personal' | 'work';
  energy_tag: 'quick_win' | 'deep_focus' | 'boring_grind';
  completed: boolean;
  created_at: string;
};

export type AnchorItem = {
  id: string;
  title: string;
  anchor_time: string;
  commute_min: number;
  prep_min: number;
  feet_on_floor_time: string | null;
  created_at: string;
};

export type SideQuest = {
  id: string;
  content: string;
  completed: boolean;
  session_id: string;
  created_at: string;
};

export type TaskBreakdown = {
  id: string;
  original_task: string;
  micro_steps: string[];
  steps_completed: number;
  created_at: string;
};
