/*
# Create Vibe Buddy tables (single-tenant, no auth)

1. New Tables
- `current_focus`: Stores up to 3 active focus items with mode (personal/work)
  - id (uuid, PK), content (text), mode (text: personal/work), position (int), completed (bool), created_at (timestamptz)
- `brain_backlog`: Master list of all tasks with energy tags
  - id (uuid, PK), content (text), mode (text: personal/work), energy_tag (text: quick_win/deep_focus/boring_grind), completed (bool), created_at (timestamptz)
- `anchors`: Non-negotiable calendar events with buffer calculations
  - id (uuid, PK), title (text), anchor_time (text), commute_min (int), prep_min (int), feet_on_floor_time (text), created_at (timestamptz)
- `side_quests`: Distractions captured during Boredom Buster sessions
  - id (uuid, PK), content (text), completed (bool), session_id (text), created_at (timestamptz)
- `task_breakdowns`: Unstick Me task breakdowns
  - id (uuid, PK), original_task (text), micro_steps (text[]), steps_completed (int), created_at (timestamptz)
- `adhd_schedules`: ADHD Math schedule results
  - id (uuid, PK), deadline_label (text), deadline_at (timestamptz), steps (jsonb), created_at (timestamptz)

2. Security
- All tables are single-tenant (no auth required)
- RLS enabled on all tables with anon+authenticated full access policies
*/

-- Current Focus: max 3 items per mode
CREATE TABLE IF NOT EXISTS current_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  mode text NOT NULL DEFAULT 'personal' CHECK (mode IN ('personal', 'work')),
  position int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Brain Backlog: all tasks with energy tags
CREATE TABLE IF NOT EXISTS brain_backlog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  mode text NOT NULL DEFAULT 'personal' CHECK (mode IN ('personal', 'work')),
  energy_tag text NOT NULL DEFAULT 'quick_win' CHECK (energy_tag IN ('quick_win', 'deep_focus', 'boring_grind')),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Anchors: non-negotiable calendar events
CREATE TABLE IF NOT EXISTS anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  anchor_time text NOT NULL,
  commute_min int NOT NULL DEFAULT 0,
  prep_min int NOT NULL DEFAULT 0,
  feet_on_floor_time text,
  created_at timestamptz DEFAULT now()
);

-- Side Quests (for Boredom Buster)
CREATE TABLE IF NOT EXISTS side_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  session_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Task Breakdowns (for Unstick Me)
CREATE TABLE IF NOT EXISTS task_breakdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_task text NOT NULL,
  micro_steps text[] NOT NULL,
  steps_completed int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ADHD Math Schedules
CREATE TABLE IF NOT EXISTS adhd_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_label text NOT NULL,
  deadline_at timestamptz NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE current_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE adhd_schedules ENABLE ROW LEVEL SECURITY;

-- Policies: anon + authenticated full access (single-tenant)
DROP POLICY IF EXISTS "anon_crud_current_focus" ON current_focus;
CREATE POLICY "anon_crud_current_focus" ON current_focus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_current_focus" ON current_focus FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_current_focus" ON current_focus FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_current_focus" ON current_focus FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_brain_backlog" ON brain_backlog;
CREATE POLICY "anon_crud_brain_backlog" ON brain_backlog FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_brain_backlog" ON brain_backlog FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_brain_backlog" ON brain_backlog FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_brain_backlog" ON brain_backlog FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_anchors" ON anchors;
CREATE POLICY "anon_crud_anchors" ON anchors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_anchors" ON anchors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_anchors" ON anchors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_anchors" ON anchors FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_side_quests" ON side_quests;
CREATE POLICY "anon_crud_side_quests" ON side_quests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_side_quests" ON side_quests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_side_quests" ON side_quests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_side_quests" ON side_quests FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_task_breakdowns" ON task_breakdowns;
CREATE POLICY "anon_crud_task_breakdowns" ON task_breakdowns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_task_breakdowns" ON task_breakdowns FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_task_breakdowns" ON task_breakdowns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_task_breakdowns" ON task_breakdowns FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_adhd_schedules" ON adhd_schedules;
CREATE POLICY "anon_crud_adhd_schedules" ON adhd_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_adhd_schedules" ON adhd_schedules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_adhd_schedules" ON adhd_schedules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_adhd_schedules" ON adhd_schedules FOR DELETE TO anon, authenticated USING (true);
