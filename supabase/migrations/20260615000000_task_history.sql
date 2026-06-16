/*
# Add task_history table

Stores completed focus items permanently. When a user marks a task done
(Poof phase), it is inserted here and removed from current_focus.
Midnight Purge also moves any remaining incomplete current_focus rows to
brain_backlog, but completed items land here instead.
*/

CREATE TABLE IF NOT EXISTS task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  mode text NOT NULL DEFAULT 'personal',
  completed_at timestamptz NOT NULL DEFAULT now(),
  source_focus_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_task_history" ON task_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_task_history" ON task_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_task_history" ON task_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_task_history" ON task_history FOR DELETE TO anon, authenticated USING (true);
