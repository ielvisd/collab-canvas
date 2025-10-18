-- Action history table for undo/redo functionality
-- Run this SQL in your Supabase SQL Editor to enable undo/redo persistence

-- Action history table for undo/redo
CREATE TABLE action_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  canvas_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('add', 'update', 'delete')),
  object_type text NOT NULL CHECK (object_type IN ('emoji', 'rectangle', 'circle', 'text')),
  object_id uuid NOT NULL,
  before_state jsonb,
  after_state jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  undone_at timestamptz
);

-- Indexes for performance
CREATE INDEX idx_action_history_user ON action_history(user_id, canvas_id, timestamp DESC);
CREATE INDEX idx_action_history_object ON action_history(object_id);

-- RLS policies
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action history" ON action_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions" ON action_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions" ON action_history
  FOR UPDATE USING (auth.uid() = user_id);
