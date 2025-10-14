-- Collab Canvas Database Schema - Collaborative Version
-- Run this SQL in your Supabase SQL Editor to enable collaborative access

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own objects" ON canvas_objects;
DROP POLICY IF EXISTS "Users can insert their own objects" ON canvas_objects;
DROP POLICY IF EXISTS "Users can update their own objects" ON canvas_objects;
DROP POLICY IF EXISTS "Users can delete their own objects" ON canvas_objects;

-- Create new collaborative RLS policies
-- All authenticated users can view all objects in any canvas
CREATE POLICY "Authenticated users can view all objects" ON canvas_objects
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can insert objects
CREATE POLICY "Authenticated users can insert objects" ON canvas_objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update all objects (for collaborative editing)
CREATE POLICY "Authenticated users can update all objects" ON canvas_objects
  FOR UPDATE USING (auth.role() = 'authenticated');

-- All authenticated users can delete all objects (for collaborative editing)
CREATE POLICY "Authenticated users can delete all objects" ON canvas_objects
  FOR DELETE USING (auth.role() = 'authenticated');

-- Optional: Allow anonymous users to view objects (for public canvases)
-- Uncomment the following lines if you want to allow anonymous access
-- CREATE POLICY "Anonymous users can view objects" ON canvas_objects
--   FOR SELECT USING (auth.role() = 'anon');
