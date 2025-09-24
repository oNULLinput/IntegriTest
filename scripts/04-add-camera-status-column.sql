-- Add missing camera_status column to exam_sessions table
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS camera_status VARCHAR(20) DEFAULT 'inactive';

-- Update existing records to have a default camera status
UPDATE exam_sessions 
SET camera_status = 'inactive' 
WHERE camera_status IS NULL;
