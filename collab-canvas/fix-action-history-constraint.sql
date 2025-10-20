-- Fix action_history table to allow NULL after_state for delete operations
-- Run this SQL in your Supabase SQL Editor

-- Remove the NOT NULL constraint from after_state column
ALTER TABLE action_history 
ALTER COLUMN after_state DROP NOT NULL;

-- Update the check constraint to allow NULL after_state for delete operations
ALTER TABLE action_history 
DROP CONSTRAINT IF EXISTS action_history_action_type_check;

ALTER TABLE action_history 
ADD CONSTRAINT action_history_action_type_check 
CHECK (action_type IN ('add', 'update', 'delete', 'delete-multiple'));

-- Update the object_type check constraint to only include emoji (since we removed shapes)
ALTER TABLE action_history 
DROP CONSTRAINT IF EXISTS action_history_object_type_check;

ALTER TABLE action_history 
ADD CONSTRAINT action_history_object_type_check 
CHECK (object_type IN ('emoji'));
