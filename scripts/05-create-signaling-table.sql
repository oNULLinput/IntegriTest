-- Create signaling messages table for WebRTC communication
CREATE TABLE IF NOT EXISTS signaling_messages (
    id BIGSERIAL PRIMARY KEY,
    exam_code VARCHAR(10) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    from_peer VARCHAR(50) NOT NULL,
    to_peer VARCHAR(50) NOT NULL,
    message_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_signaling_messages_exam_to 
ON signaling_messages(exam_code, to_peer, created_at);

-- Enable RLS
ALTER TABLE signaling_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is for exam monitoring)
CREATE POLICY "Allow all signaling operations" ON signaling_messages
FOR ALL USING (true);

-- Auto-cleanup old signaling messages (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_signaling_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM signaling_messages 
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-signaling', '*/30 * * * *', 'SELECT cleanup_old_signaling_messages();');
