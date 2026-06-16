import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Mode, EnergyTag } from '@/lib/constants';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fzcqibexnuhtdavsbpmh.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y3FpYmV4bnVodGRhdnNicG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNzUsImV4cCI6MjA5NjExODI3NX0.o2ktlkWm-2aPiAR93TtOBDPxGu25HtG8-uRbfDlrBPw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type FocusItem = {
  id: string;
  content: string;
  mode: Mode;
  position: number;
  completed: boolean;
  created_at: string;
};

export type BacklogItem = {
  id: string;
  content: string;
  mode: Mode;
  energy_tag: EnergyTag;
  completed: boolean;
  created_at: string;
};

export type AnchorItem = {
  id: string;
  title: string;
  anchor_time: string;
  anchor_at: string | null;
  feet_on_floor_at: string | null;
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

export type AdhdSchedule = {
  id: string;
  deadline_label: string;
  deadline_at: string;
  steps: Record<string, unknown>[];
  created_at: string;
};

export type TaskHistory = {
  id: string;
  content: string;
  mode: Mode;
  completed_at: string;
  source_focus_id: string | null;
  created_at: string;
};
