-- 清理现有数据
DROP TABLE IF EXISTS signaling_messages;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS meetings;
DROP VIEW IF EXISTS active_meetings_with_count;

-- 创建会议表
CREATE TABLE meetings (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 6,
  host_id TEXT,
  owner_token VARCHAR(255), -- 创建者令牌
  owner_user_id VARCHAR(255), -- 创建者用户ID
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- 创建参与者表
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- 用户ID
  nickname VARCHAR(50) NOT NULL,
  is_host BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP
);

-- 创建信令消息表（用于WebRTC信令）
CREATE TABLE signaling_messages (
  id SERIAL PRIMARY KEY,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
  from_participant TEXT,
  to_participant TEXT,
  signal_type VARCHAR(50) NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建视图：活跃会议及参与者数量
CREATE VIEW active_meetings_with_count AS
SELECT 
  m.*,
  COALESCE(p.current_participants, 0) as current_participants
FROM meetings m
LEFT JOIN (
  SELECT 
    meeting_id,
    COUNT(*) as current_participants
  FROM participants 
  WHERE is_connected = true
  GROUP BY meeting_id
) p ON m.id = p.meeting_id
WHERE m.status = 'active';

-- 创建索引
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_is_public ON meetings(is_public);
CREATE INDEX idx_meetings_created_at ON meetings(created_at);
CREATE INDEX idx_meetings_owner_token ON meetings(owner_token);
CREATE INDEX idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX idx_participants_is_connected ON participants(is_connected);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_signaling_meeting_id ON signaling_messages(meeting_id);
CREATE INDEX idx_signaling_to_participant ON signaling_messages(to_participant);

-- 自动清理旧的信令消息（保留最近1小时）
CREATE OR REPLACE FUNCTION cleanup_old_signaling_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM signaling_messages 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 自动清理结束的会议和参与者
CREATE OR REPLACE FUNCTION cleanup_ended_meetings()
RETURNS void AS $$
BEGIN
  -- 将超过24小时无活跃参与者的会议标记为结束
  UPDATE meetings 
  SET status = 'ended', ended_at = NOW()
  WHERE status = 'active' 
    AND id NOT IN (
      SELECT DISTINCT meeting_id 
      FROM participants 
      WHERE is_connected = true
    )
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- 删除超过7天的结束会议记录
  DELETE FROM meetings 
  WHERE status = 'ended' 
    AND (ended_at < NOW() - INTERVAL '7 days' OR created_at < NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务触发器
CREATE OR REPLACE FUNCTION trigger_cleanup()
RETURNS trigger AS $$
BEGIN
  -- 清理信令消息
  PERFORM cleanup_old_signaling_messages();
  
  -- 清理结束的会议
  PERFORM cleanup_ended_meetings();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在插入新会议时触发清理
CREATE TRIGGER trigger_cleanup_on_meeting_insert
  AFTER INSERT ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup();

-- 设置行级安全策略 (RLS)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signaling_messages ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取活跃的公开会议
CREATE POLICY "Allow read active public meetings" ON meetings
  FOR SELECT USING (status = 'active' AND is_public = true);

-- 允许所有人读取会议详情（用于加入）
CREATE POLICY "Allow read meeting details" ON meetings
  FOR SELECT USING (status = 'active');

-- 允许插入新会议
CREATE POLICY "Allow insert meetings" ON meetings
  FOR INSERT WITH CHECK (true);

-- 允许创建者更新自己的会议
CREATE POLICY "Allow update own meetings" ON meetings
  FOR UPDATE USING (true);

-- 允许读取参与者信息
CREATE POLICY "Allow read participants" ON participants
  FOR SELECT USING (true);

-- 允许插入参与者
CREATE POLICY "Allow insert participants" ON participants
  FOR INSERT WITH CHECK (true);

-- 允许更新参与者状态
CREATE POLICY "Allow update participants" ON participants
  FOR UPDATE USING (true);

-- 允许删除参与者
CREATE POLICY "Allow delete participants" ON participants
  FOR DELETE USING (true);

-- 允许读取信令消息
CREATE POLICY "Allow read signaling messages" ON signaling_messages
  FOR SELECT USING (true);

-- 允许插入信令消息
CREATE POLICY "Allow insert signaling messages" ON signaling_messages
  FOR INSERT WITH CHECK (true);

-- 允许删除信令消息
CREATE POLICY "Allow delete signaling messages" ON signaling_messages
  FOR DELETE USING (true);