/**
 * Comprehensive Type Definitions for MugShot Studio API
 * This file contains all shared types used across the application
 */

// ==================== USER TYPES ====================
export interface User {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    dob?: string;
    profile_photo_url?: string;
    bio?: string;
    website?: string;
    plan: string;
    credits: number;
    created_at: string;
    is_verified?: boolean;
    is_public?: boolean;
    email_confirmed?: boolean;
    newsletter_opt_in?: boolean;
}

export interface PublicUser {
    id: string;
    username: string;
    full_name?: string;
    profile_photo_url?: string;
    bio?: string;
    followers_count: number;
    following_count: number;
    projects_count: number;
    is_following?: boolean;
    is_verified?: boolean;
}

export interface TopCreator extends PublicUser {
    is_verified: boolean;
}

// ==================== PROJECT TYPES ====================
export interface Project {
    id: string;
    name: string;
    description?: string;
    thumbnail_url?: string;
    visibility: 'private' | 'public' | 'unlisted';
    created_at: string;
    updated_at: string;
    likes_count: number;
    views_count: number;
    user_id: string;
    template_id?: string;
    is_liked?: boolean;
    is_favorite?: boolean;
    category?: string;
    user?: {
        username: string;
        full_name?: string;
        profile_photo_url?: string;
    };
}

export interface ProjectCreate {
    name: string;
    description?: string;
    template_id?: string;
}

export interface ProjectUpdate {
    name?: string;
    description?: string;
    visibility?: 'private' | 'public' | 'unlisted';
    category?: string;
}

// ==================== TEMPLATE TYPES ====================
export interface Template {
    id: string;
    name: string;
    description?: string;
    thumbnail_url?: string;
    category: string;
    tags: string[];
    votes_up: number;
    votes_down: number;
    remix_count: number;
    is_official: boolean;
    created_at: string;
    user_id: string;
    user?: {
        username: string;
        full_name?: string;
        profile_photo_url?: string;
    };
}

export interface TemplateCategory {
    name: string;
    count: number;
}

// ==================== ASSET TYPES ====================
export interface Asset {
    id: string;
    filename: string;
    file_url: string;
    url: string;
    file_type: string;
    mime_type: string;
    file_size: number;
    size: number;
    created_at: string;
    user_id: string;
    is_favorite?: boolean;
}

// ==================== JOB TYPES ====================
export interface Job {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result_url?: string;
    error?: string;
    created_at: string;
    project_id: string;
}

export interface JobCreate {
    project_id: string;
    prompt: string;
    model?: string;
    quality?: string;
}

// ==================== BILLING TYPES ====================
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    credits: number;
    features: string[];
    is_popular?: boolean;
}

export interface Subscription {
    plan: SubscriptionPlan;
    status: string;
    expires_at: string;
    auto_renew?: boolean;
}

export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    bonus_credits?: number;
}

export interface BillingHistory {
    id: string;
    type: 'subscription' | 'credit_pack';
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded';
    created_at: string;
    description: string;
}

export interface PaymentMethod {
    id: string;
    type: string;
    last4?: string;
    expiry?: string;
    is_default: boolean;
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: Record<string, unknown>;
}

export interface NotificationSettings {
    email_marketing: boolean;
    email_updates: boolean;
    email_community: boolean;
    push_enabled: boolean;
}

// ==================== PREFERENCES TYPES ====================
export interface Preferences {
    theme: 'light' | 'dark' | 'system';
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    default_quality: string;
    default_model: string;
}

// ==================== MODEL & TOOL TYPES ====================
export interface Model {
    id: string;
    name: string;
    description?: string;
    provider: string;
    is_available: boolean;
    credits_per_generation: number;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon?: string;
    credits_per_use: number;
}

export interface Quality {
    id: string;
    name: string;
    credits_multiplier: number;
}

// ==================== COMMENT TYPES ====================
export interface Comment {
    id: string;
    content: string;
    user_id: string;
    template_id: string;
    created_at: string;
    user?: {
        username: string;
        full_name?: string;
        profile_photo_url?: string;
    };
}

// ==================== SUPPORT TYPES ====================
export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    updated_at: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

// ==================== ACTIVITY TYPES ====================
export interface ActivityLog {
    id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

// ==================== SESSION TYPES ====================
export interface Session {
    id: string;
    device: string;
    ip_address: string;
    last_active: string;
    is_current: boolean;
}

// ==================== REFERRAL TYPES ====================
export interface ReferralCode {
    code: string;
    discount_percent: number;
}

export interface ReferralStats {
    total_referrals: number;
    active_referrals: number;
    total_earnings: number;
}

export interface ReferredUser {
    user_id: string;
    joined_at: string;
    status: string;
}

// ==================== EXPERIMENTAL TYPES ====================
export interface ExperimentalSettings {
    features: Record<string, boolean>;
}

export interface ApiKey {
    provider: string;
    is_valid: boolean;
    created_at: string;
}

// ==================== CHAT TYPES ====================
export interface Chat {
    id: string;
    title: string;
    created_at?: string;
}

export interface ChatMessage {
    role: string;
    content: string;
    created_at?: string;
}

// ==================== EXPORT TYPES ====================
export interface ExportStatus {
    status: string;
    progress: number;
    download_url?: string;
}

// ==================== CREDITS TYPES ====================
export interface CreditBalance {
    credits: number;
    bonus_credits: number;
}

export interface CreditUsage {
    date: string;
    credits_used: number;
}

// ==================== OPENROUTER TYPES ====================
export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

// ==================== PAGINATION TYPES ====================
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page?: number;
    limit?: number;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiError {
    detail: string;
    status_code?: number;
}

export interface MessageResponse {
    message: string;
}

export interface CheckoutResponse {
    checkout_url: string;
}

export interface OrderResponse {
    order_id: string;
    amount?: number;
    subscription_id?: string;
}
