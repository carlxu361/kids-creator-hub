-- ============================================
-- 小创客冒险之旅 - 数据库初始化
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 用户表 ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    display_name VARCHAR(20) NOT NULL,
    avatar_emoji VARCHAR(10) DEFAULT '🐱',
    invite_code VARCHAR(8) UNIQUE NOT NULL,
    xp INTEGER DEFAULT 0,
    level_count INTEGER DEFAULT 0,
    step_count INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    sound_on BOOLEAN DEFAULT TRUE,
    parental_consent BOOLEAN DEFAULT FALSE,
    parent_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 用户进度表 ====================
CREATE TABLE user_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    step_index INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    verify_status VARCHAR(20) DEFAULT 'pending',
    PRIMARY KEY (user_id, level_id, step_index)
);

-- ==================== 关卡完成表 ====================
CREATE TABLE user_levels (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    xp_earned INTEGER NOT NULL,
    PRIMARY KEY (user_id, level_id)
);

-- ==================== 好友关系表 ====================
CREATE TABLE friendships (
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (requester_id, addressee_id),
    CHECK (requester_id <> addressee_id)
);

-- ==================== PK 对战表 ====================
CREATE TABLE pk_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    completed_at TIMESTAMPTZ
);

-- ==================== PK 进度表 ====================
CREATE TABLE pk_progress (
    challenge_id UUID REFERENCES pk_challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (challenge_id, user_id, step_index)
);

-- ==================== 活动动态表 ====================
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 索引 ====================
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_levels_user ON user_levels(user_id);
CREATE INDEX idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id, status);
CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_pk_challenges_challenger ON pk_challenges(challenger_id, status);
CREATE INDEX idx_pk_challenges_opponent ON pk_challenges(opponent_id, status);
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_invite ON users(invite_code);

-- ==================== Row Level Security ====================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 用户表策略：只能读写自己的数据
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 用户可以查看好友的公开信息（通过排行榜视图）
CREATE POLICY "Users can view friends profiles" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND (
                (requester_id = auth.uid() AND addressee_id = users.id)
                OR
                (addressee_id = auth.uid() AND requester_id = users.id)
            )
        )
    );

-- 用户进度策略：只能读写自己的进度
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- 可以查看好友的进度（用于好友对比）
CREATE POLICY "Users can view friends progress" ON user_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND (
                (requester_id = auth.uid() AND addressee_id = user_progress.user_id)
                OR
                (addressee_id = auth.uid() AND requester_id = user_progress.user_id)
            )
        )
    );

-- 关卡完成策略
CREATE POLICY "Users can view own levels" ON user_levels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own levels" ON user_levels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own levels" ON user_levels
    FOR DELETE USING (auth.uid() = user_id);

-- 好友关系策略
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own friendships" ON friendships
    FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- PK 对战策略
CREATE POLICY "Users can view own challenges" ON pk_challenges
    FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges" ON pk_challenges
    FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update own challenges" ON pk_challenges
    FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- PK 进度策略
CREATE POLICY "Users can view challenge progress" ON pk_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pk_challenges
            WHERE pk_challenges.id = pk_progress.challenge_id
            AND (pk_challenges.challenger_id = auth.uid() OR pk_challenges.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert own pk progress" ON pk_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pk progress" ON pk_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- 活动动态策略
CREATE POLICY "Users can view friends activities" ON activities
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND (
                (requester_id = auth.uid() AND addressee_id = activities.user_id)
                OR
                (addressee_id = auth.uid() AND requester_id = activities.user_id)
            )
        )
    );

CREATE POLICY "Users can insert own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================== 辅助函数 ====================

-- 生成随机邀请码
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(8) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 检查昵称是否包含不当内容（简化版）
CREATE OR REPLACE FUNCTION check_display_name(name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- 检查长度
    IF length(name) < 2 OR length(name) > 20 THEN
        RETURN FALSE;
    END IF;
    -- 可以在这里添加更多过滤规则
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==================== 排行榜视图 ====================
CREATE VIEW leaderboard AS
SELECT
    id,
    display_name,
    avatar_emoji,
    xp,
    level_count,
    step_count,
    streak_count,
    ROW_NUMBER() OVER (ORDER BY xp DESC) as rank
FROM users
WHERE parental_consent = TRUE OR parental_consent = FALSE
ORDER BY xp DESC;
