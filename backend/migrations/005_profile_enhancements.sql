-- Migration 005: Add profile enhancements, user preferences, and follow system
-- Created: 2024-12-19
-- Description: Adds bio, social fields to users, creates user_preferences table, 
--              user_follows table, and referral system tables

-- ============================================
-- PART 1: Enhance Users Table
-- ============================================

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add check constraint for bio length
ALTER TABLE users ADD CONSTRAINT chk_bio_length CHECK (char_length(bio) <= 150);

-- ============================================
-- PART 2: User Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Appearance
    dark_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en-US',
    font_size INTEGER DEFAULT 16 CHECK (font_size >= 12 AND font_size <= 20),
    high_contrast BOOLEAN DEFAULT FALSE,
    
    -- Generation Settings
    hd_generation BOOLEAN DEFAULT TRUE,
    default_ai_model VARCHAR(50) DEFAULT 'nano_banana',
    generation_variants INTEGER DEFAULT 4 CHECK (generation_variants >= 2 AND generation_variants <= 6),
    nsfw_filter BOOLEAN DEFAULT TRUE,
    watermark BOOLEAN DEFAULT FALSE,
    offline_mode BOOLEAN DEFAULT FALSE,
    
    -- Notifications
    job_complete_notify BOOLEAN DEFAULT TRUE,
    low_credit_notify BOOLEAN DEFAULT TRUE,
    updates_notify BOOLEAN DEFAULT TRUE,
    newsletter_opt_in BOOLEAN DEFAULT FALSE,
    billing_alerts BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    
    -- Privacy
    analytics_sharing BOOLEAN DEFAULT TRUE,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    
    -- Subscription
    auto_renew BOOLEAN DEFAULT TRUE,
    credit_alert_threshold INTEGER DEFAULT 10 CHECK (credit_alert_threshold >= 5 AND credit_alert_threshold <= 50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- PART 3: Follow System Tables
-- ============================================

CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)  -- Can't follow yourself
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);

-- User Blocks Table
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- PART 4: Referral System Tables
-- ============================================

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    code VARCHAR(20) UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER,  -- NULL = unlimited
    reward_credits INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID REFERENCES referral_codes(id),
    referred_user_id UUID REFERENCES users(id),
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- ============================================
-- PART 5: Subscription & Billing Tables
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,  -- 'free', 'pro', 'enterprise'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    credits_per_month INTEGER NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, credits_per_month, features, display_order)
VALUES 
    ('free', 'Free', 'Get started with basic features', 0, 0, 100, '["100 credits/month", "Standard quality", "Community support"]', 0),
    ('pro', 'Pro', 'For creators who need more power', 9.99, 99.99, 500, '["500 credits/month", "HD quality", "Priority support", "No watermark"]', 1),
    ('enterprise', 'Enterprise', 'For teams and businesses', 29.99, 299.99, 2000, '["2000 credits/month", "4K quality", "Dedicated support", "API access", "Custom models"]', 2)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',  -- 'active', 'canceled', 'expired', 'past_due'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    invoice_url VARCHAR(500),
    status VARCHAR(20),  -- 'paid', 'pending', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 6: Data Export Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'ready', 'expired'
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- PART 7: Update Trigger for updated_at columns
-- ============================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 8: Project Visibility Fields
-- ============================================

-- Add visibility fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for public projects
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);

-- Project Likes Table
CREATE TABLE IF NOT EXISTS project_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_likes_project ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user ON project_likes(user_id);

-- ============================================
-- PART 9: Support Tickets Table
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open',
    contact_email VARCHAR(255),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DOWN MIGRATION (commented out)
-- ============================================
-- DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
-- DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
-- DROP TABLE IF EXISTS data_export_requests;
-- DROP TABLE IF EXISTS billing_history;
-- DROP TABLE IF EXISTS user_subscriptions;
-- DROP TABLE IF EXISTS subscription_plans;
-- DROP TABLE IF EXISTS referral_uses;
-- DROP TABLE IF EXISTS referral_codes;
-- DROP TABLE IF EXISTS user_blocks;
-- DROP TABLE IF EXISTS user_follows;
-- DROP TABLE IF EXISTS user_preferences;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_bio_length;
-- ALTER TABLE users DROP COLUMN IF EXISTS bio;
-- ALTER TABLE users DROP COLUMN IF EXISTS website_url;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_public;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
