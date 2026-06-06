/*
# Expand mode options for Personal/Work/School/Other

1. Changes
- Alter `current_focus` mode CHECK constraint to allow: personal, work, school, other
- Alter `brain_backlog` mode CHECK constraint to allow: personal, work, school, other
- Drop old constraints and add new ones
*/

ALTER TABLE current_focus DROP CONSTRAINT IF EXISTS current_focus_mode_check;
ALTER TABLE current_focus ADD CONSTRAINT current_focus_mode_check CHECK (mode IN ('personal', 'work', 'school', 'other'));

ALTER TABLE brain_backlog DROP CONSTRAINT IF EXISTS brain_backlog_mode_check;
ALTER TABLE brain_backlog ADD CONSTRAINT brain_backlog_mode_check CHECK (mode IN ('personal', 'work', 'school', 'other'));
