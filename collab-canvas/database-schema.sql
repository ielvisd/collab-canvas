-- Collab Canvas Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create canvas_objects table for storing shapes
CREATE TABLE canvas_objects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  canvas_id UUID NOT NULL, -- For future multi-canvas support
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'rect', 'circle', 'text', etc.
  data JSONB NOT NULL, -- Shape properties (x, y, width, height, color, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL -- Soft delete
);

-- Create index for better performance
CREATE INDEX idx_canvas_objects_canvas_id ON canvas_objects(canvas_id);
CREATE INDEX idx_canvas_objects_user_id ON canvas_objects(user_id);
CREATE INDEX idx_canvas_objects_type ON canvas_objects(type);
CREATE INDEX idx_canvas_objects_created_at ON canvas_objects(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_canvas_objects_updated_at
  BEFORE UPDATE ON canvas_objects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE canvas_objects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see objects they created or objects in canvases they have access to
CREATE POLICY "Users can view their own objects" ON canvas_objects
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own objects
CREATE POLICY "Users can insert their own objects" ON canvas_objects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own objects
CREATE POLICY "Users can update their own objects" ON canvas_objects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own objects
CREATE POLICY "Users can delete their own objects" ON canvas_objects
  FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for canvas_objects table
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_objects;

-- Create a function to get canvas objects for a specific canvas
CREATE OR REPLACE FUNCTION get_canvas_objects(canvas_uuid UUID)
RETURNS TABLE (
  id UUID,
  canvas_id UUID,
  user_id UUID,
  type VARCHAR(50),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    co.id,
    co.canvas_id,
    co.user_id,
    co.type,
    co.data,
    co.created_at,
    co.updated_at
  FROM canvas_objects co
  WHERE co.canvas_id = canvas_uuid
    AND co.deleted_at IS NULL
  ORDER BY co.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON canvas_objects TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_canvas_objects(UUID) TO anon, authenticated;

