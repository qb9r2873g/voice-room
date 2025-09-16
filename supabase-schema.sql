-- Voice Room Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY DEFAULT upper(substring(replace(uuid_generate_v4()::text, '-', ''), 1, 6)),
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 6,
    host_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended'))
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    is_host BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    is_connected BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE
);

-- Signaling table for WebRTC coordination
CREATE TABLE IF NOT EXISTS signaling (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
    from_participant UUID REFERENCES participants(id) ON DELETE CASCADE,
    to_participant UUID REFERENCES participants(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
    signal_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_is_public ON meetings(is_public);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_is_connected ON participants(is_connected);
CREATE INDEX IF NOT EXISTS idx_signaling_meeting_id ON signaling(meeting_id);
CREATE INDEX IF NOT EXISTS idx_signaling_processed ON signaling(processed);

-- RLS (Row Level Security) Policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signaling ENABLE ROW LEVEL SECURITY;

-- Meetings policies
CREATE POLICY "Public meetings are viewable by everyone" ON meetings
    FOR SELECT USING (is_public = true OR status = 'active');

CREATE POLICY "Anyone can create meetings" ON meetings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only host can update meetings" ON meetings
    FOR UPDATE USING (true); -- Simplified for demo

-- Participants policies
CREATE POLICY "Participants are viewable by meeting participants" ON participants
    FOR SELECT USING (true); -- Simplified for demo

CREATE POLICY "Anyone can join as participant" ON participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update their own status" ON participants
    FOR UPDATE USING (true); -- Simplified for demo

-- Signaling policies
CREATE POLICY "Signaling visible to meeting participants" ON signaling
    FOR SELECT USING (true); -- Simplified for demo

CREATE POLICY "Participants can send signals" ON signaling
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update signal processing status" ON signaling
    FOR UPDATE USING (true); -- Simplified for demo

-- Function to automatically end meetings when all participants leave
CREATE OR REPLACE FUNCTION check_and_end_empty_meetings()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this was the last connected participant
    IF OLD.is_connected = true AND NEW.is_connected = false THEN
        -- Check if there are any other connected participants
        IF NOT EXISTS (
            SELECT 1 FROM participants 
            WHERE meeting_id = NEW.meeting_id 
            AND is_connected = true 
            AND id != NEW.id
        ) THEN
            -- End the meeting
            UPDATE meetings 
            SET status = 'ended', ended_at = NOW() 
            WHERE id = NEW.meeting_id AND status = 'active';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to end meetings when all participants leave
CREATE TRIGGER trigger_end_empty_meetings
    AFTER UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION check_and_end_empty_meetings();

-- Function to clean up old signaling data
CREATE OR REPLACE FUNCTION cleanup_old_signaling()
RETURNS void AS $$
BEGIN
    DELETE FROM signaling 
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- View for active meetings with participant count
CREATE OR REPLACE VIEW active_meetings_with_count AS
SELECT 
    m.*,
    COALESCE(p.participant_count, 0) as current_participants
FROM meetings m
LEFT JOIN (
    SELECT 
        meeting_id,
        COUNT(*) as participant_count
    FROM participants 
    WHERE is_connected = true
    GROUP BY meeting_id
) p ON m.id = p.meeting_id
WHERE m.status = 'active';