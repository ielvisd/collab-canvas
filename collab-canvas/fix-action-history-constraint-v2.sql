-- Fix action_history table to allow NULL after_state for delete operations
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Remove the NOT NULL constraint from after_state column
ALTER TABLE action_history 
ALTER COLUMN after_state DROP NOT NULL;

-- Step 2: Clean up existing data - delete all non-emoji records
DELETE FROM action_history 
WHERE object_type NOT IN ('emoji');

-- Step 3: Update the check constraint to allow NULL after_state for delete operations
ALTER TABLE action_history 
DROP CONSTRAINT IF EXISTS action_history_action_type_check;

ALTER TABLE action_history 
ADD CONSTRAINT action_history_action_type_check 
CHECK (action_type IN ('add', 'update', 'delete', 'delete-multiple'));

-- Step 4: Update the object_type check constraint to only include emoji
ALTER TABLE action_history 
DROP CONSTRAINT IF EXISTS action_history_object_type_check;

ALTER TABLE action_history 
ADD CONSTRAINT action_history_object_type_check 
CHECK (object_type IN ('emoji'));

-- Step 5: Verify the changes
SELECT 
  action_type, 
  object_type, 
  COUNT(*) as count 
FROM action_history 
GROUP BY action_type, object_type 
ORDER BY action_type, object_type;
