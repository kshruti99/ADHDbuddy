/*
# Add timestamp columns to anchors for live calendar

- anchor_at: event datetime
- feet_on_floor_at: auto-computed start time (event - commute - prep)
*/

ALTER TABLE anchors
  ADD COLUMN IF NOT EXISTS anchor_at timestamptz,
  ADD COLUMN IF NOT EXISTS feet_on_floor_at timestamptz;
