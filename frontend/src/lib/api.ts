'use client';

const API_URL = process.env.NODE_ENV === 'development' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'https://mugshot-studio-api.onrender.com');

// Helper function for authenticated requests
async function authFetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || error.message || 'Request failed');
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// Helper for file uploads
async function uploadFetch(endpoint: string, formData: FormData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: HeadersInit = {
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || error.message || 'Upload failed');
    }

    return response.json();
}

// Types
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

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    type: 'subscription' | 'credit_pack';
    description: string;
    created_at: string;
    invoice_url?: string;
}

export interface Job {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result_url?: string;
    error?: string;
    created_at: string;
    project_id: string;
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
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: Record<string, unknown>;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    credits_per_month: number;
    features: string[];
    is_active: boolean;
    display_order: number;
    is_popular?: boolean; // Kept for frontend convenience if API doesn't provide it, though user said "highlighted" property exists in frontend component
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

export interface Preferences {
    theme: 'light' | 'dark' | 'system';
    email_notifications: boolean;
    push_notifications: boolean;
    marketing_emails: boolean;
    default_quality: string;
    default_model: string;
}

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

export interface ActivityLog {
    id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

// ==================== PROJECTS API ====================
export const projectsApi = {
    async create(data: { name: string; description?: string; template_id?: string }): Promise<Project> {
        return authFetch('/api/v1/projects/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async get(projectId: string): Promise<Project> {
        return authFetch(`/api/v1/projects/${projectId}`);
    },

    async update(projectId: string, data: Partial<Project>): Promise<Project> {
        return authFetch(`/api/v1/projects/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
    },

    async bulkDelete(projectIds: string[]): Promise<void> {
        return authFetch('/api/v1/projects/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ project_ids: projectIds }),
        });
    },

    async getJobs(projectId: string): Promise<Job[]> {
        return authFetch(`/api/v1/projects/${projectId}/jobs`);
    },

    async queueGeneration(projectId: string, data: { prompt: string; model?: string; quality?: string }): Promise<Job> {
        return authFetch(`/api/v1/projects/${projectId}/queue`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateVisibility(projectId: string, visibility: 'private' | 'public' | 'unlisted'): Promise<Project> {
        return authFetch(`/api/v1/projects/${projectId}/visibility`, {
            method: 'PATCH',
            body: JSON.stringify({ visibility }),
        });
    },

    async likeProject(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/like`, { method: 'POST' });
    },

    async unlikeProject(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/like`, { method: 'DELETE' });
    },

    async checkLiked(projectId: string): Promise<{ liked: boolean }> {
        return authFetch(`/api/v1/projects/${projectId}/is-liked`);
    },

    async recordView(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/view`, { method: 'POST' });
    },

    async getPublicProject(projectId: string): Promise<Project> {
        return authFetch(`/api/v1/projects/public/${projectId}`);
    },

    // Gallery endpoints
    async getFeaturedGallery(page = 1, limit = 20): Promise<{ items: Project[]; total: number }> {
        return authFetch(`/api/v1/projects/gallery/featured?page=${page}&limit=${limit}`);
    },

    async getTrendingGallery(page = 1, limit = 20): Promise<{ items: Project[]; total: number }> {
        return authFetch(`/api/v1/projects/gallery/trending?page=${page}&limit=${limit}`);
    },

    async getRecentGallery(page = 1, limit = 20): Promise<{ items: Project[]; total: number }> {
        return authFetch(`/api/v1/projects/gallery/recent?page=${page}&limit=${limit}`);
    },

    async getUserPublicProjects(userId: string, page = 1, limit = 20): Promise<{ items: Project[]; total: number }> {
        return authFetch(`/api/v1/projects/user/${userId}/public?page=${page}&limit=${limit}`);
    },

    async getFollowingGallery(page = 1, limit = 20): Promise<{ items: Project[]; total: number }> {
        return authFetch(`/api/v1/projects/gallery/following?page=${page}&limit=${limit}`);
    },

    async like(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/like`, { method: 'POST' });
    },

    async unlike(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/like`, { method: 'DELETE' });
    },

    async favorite(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/favorite`, { method: 'POST' });
    },

    async unfavorite(projectId: string): Promise<void> {
        return authFetch(`/api/v1/projects/${projectId}/favorite`, { method: 'DELETE' });
    },

    async list(params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<{ items: Project[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.category) searchParams.append('category', params.category);
        if (params?.search) searchParams.append('search', params.search);
        return authFetch(`/api/v1/projects/?${searchParams.toString()}`);
    },
};

// ==================== TEMPLATES API ====================
export const templatesApi = {
    async getAll(params?: { category?: string; search?: string; page?: number; limit?: number }): Promise<{ items: Template[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.append('category', params.category);
        if (params?.search) searchParams.append('search', params.search);
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        return authFetch(`/api/v1/templates/?${searchParams.toString()}`);
    },

    async getById(templateId: string): Promise<Template> {
        return authFetch(`/api/v1/templates/${templateId}`);
    },

    async getCategories(): Promise<string[]> {
        return authFetch('/api/v1/templates/categories');
    },

    async getAllCategories(): Promise<{ name: string; count: number }[]> {
        return authFetch('/api/v1/templates/list');
    },

    async getOfficial(): Promise<Template[]> {
        return authFetch('/api/v1/templates/official');
    },

    async vote(templateId: string, vote: 'up' | 'down'): Promise<void> {
        return authFetch(`/api/v1/templates/${templateId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    },

    async publish(projectId: string, data: { name: string; description?: string; category: string; tags?: string[] }): Promise<Template> {
        return authFetch(`/api/v1/templates/${projectId}/publish`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getRemixes(templateId: string): Promise<Template[]> {
        return authFetch(`/api/v1/templates/${templateId}/remixes`);
    },

    async remix(templateId: string): Promise<Project> {
        return authFetch(`/api/v1/templates/${templateId}/remix`, { method: 'POST' });
    },

    async update(templateId: string, data: Partial<Template>): Promise<Template> {
        return authFetch(`/api/v1/templates/${templateId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(templateId: string): Promise<void> {
        return authFetch(`/api/v1/templates/${templateId}`, { method: 'DELETE' });
    },
};

// ==================== COMMENTS API ====================
export const commentsApi = {
    async getTemplateComments(templateId: string): Promise<Comment[]> {
        return authFetch(`/api/v1/comments/template/${templateId}`);
    },

    async create(templateId: string, content: string): Promise<Comment> {
        return authFetch(`/api/v1/comments/template/${templateId}`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    async delete(commentId: string): Promise<void> {
        return authFetch(`/api/v1/comments/${commentId}`, { method: 'DELETE' });
    },
};

// ==================== ASSETS API ====================
export const assetsApi = {
    async list(params?: { page?: number; limit?: number; type?: string }): Promise<{ items: Asset[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.type) searchParams.append('type', params.type);
        return authFetch(`/api/v1/assets/?${searchParams.toString()}`);
    },

    async upload(file: File): Promise<Asset> {
        const formData = new FormData();
        formData.append('file', file);
        return uploadFetch('/api/v1/assets/upload', formData);
    },

    async delete(assetId: string): Promise<void> {
        return authFetch(`/api/v1/assets/${assetId}`, { method: 'DELETE' });
    },

    async bulkDelete(assetIds: string[]): Promise<void> {
        return authFetch('/api/v1/assets/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ asset_ids: assetIds }),
        });
    },

    async getAll(params?: { page?: number; limit?: number; type?: string }): Promise<{ items: Asset[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.type) searchParams.append('type', params.type);
        return authFetch(`/api/v1/assets/?${searchParams.toString()}`);
    },

    async getFavorites(): Promise<{ items: Asset[]; total: number }> {
        return authFetch('/api/v1/assets/favorites');
    },

    async favorite(assetId: string): Promise<void> {
        return authFetch(`/api/v1/assets/${assetId}/favorite`, { method: 'POST' });
    },

    async unfavorite(assetId: string): Promise<void> {
        return authFetch(`/api/v1/assets/${assetId}/favorite`, { method: 'DELETE' });
    },
};

// ==================== CHAT API ====================
export const chatApi = {
    async create(data?: { title?: string }): Promise<{ id: string; title: string }> {
        return authFetch('/api/v1/chat/new', {
            method: 'POST',
            body: JSON.stringify(data || {}),
        });
    },

    async get(chatId: string): Promise<{ id: string; title: string; created_at: string }> {
        return authFetch(`/api/v1/chat/${chatId}`);
    },

    async getMessages(chatId: string): Promise<{ role: string; content: string; created_at: string }[]> {
        return authFetch(`/api/v1/chat/${chatId}/messages`);
    },

    async sendMessage(chatId: string, content: string): Promise<{ role: string; content: string }> {
        return authFetch(`/api/v1/chat/${chatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },
};

// ==================== USERS API ====================
export const usersApi = {
    async search(query: string): Promise<PublicUser[]> {
        return authFetch(`/api/v1/users/search?q=${encodeURIComponent(query)}`);
    },

    async getPublicProfile(username: string): Promise<PublicUser> {
        return authFetch(`/api/v1/users/@${username}`);
    },

    async getPublicProfileById(userId: string): Promise<PublicUser> {
        return authFetch(`/api/v1/users/${userId}`);
    },

    async follow(userId: string): Promise<void> {
        return authFetch(`/api/v1/users/${userId}/follow`, { method: 'POST' });
    },

    async unfollow(userId: string): Promise<void> {
        return authFetch(`/api/v1/users/${userId}/follow`, { method: 'DELETE' });
    },

    async getFollowers(userId: string): Promise<PublicUser[]> {
        return authFetch(`/api/v1/users/${userId}/followers`);
    },

    async getFollowing(userId: string): Promise<PublicUser[]> {
        return authFetch(`/api/v1/users/${userId}/following`);
    },

    async checkFollowing(userId: string): Promise<{ is_following: boolean }> {
        return authFetch(`/api/v1/users/${userId}/is-following`);
    },

    async block(userId: string): Promise<void> {
        return authFetch(`/api/v1/users/${userId}/block`, { method: 'POST' });
    },

    async unblock(userId: string): Promise<void> {
        return authFetch(`/api/v1/users/${userId}/block`, { method: 'DELETE' });
    },

    async getTopCreators(): Promise<{ id: string; username: string; full_name: string; profile_photo_url: string; followers_count: number; projects_count: number; is_verified: boolean; is_following: boolean }[]> {
        return authFetch('/api/v1/users/top-creators');
    },
};

// ==================== PREFERENCES API ====================
export const preferencesApi = {
    async get(): Promise<Preferences> {
        return authFetch('/api/v1/profile/preferences/');
    },

    async update(preferences: Partial<Preferences>): Promise<Preferences> {
        return authFetch('/api/v1/profile/preferences/', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    },

    async updateSingle(key: string, value: unknown): Promise<Preferences> {
        return authFetch(`/api/v1/profile/preferences/${key}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
        });
    },
};

// ==================== BILLING API ====================
export const billingApi = {
    async getPlans(): Promise<SubscriptionPlan[]> {
        return authFetch('/api/v1/billing/plans');
    },

    async getCurrentSubscription(): Promise<{ plan: SubscriptionPlan; status: string; expires_at: string; auto_renew?: boolean } | null> {
        return authFetch('/api/v1/billing/current');
    },

    async getHistory(): Promise<BillingHistory[]> {
        return authFetch('/api/v1/billing/history');
    },

    async subscribe(planId: string): Promise<{ checkout_url: string }> {
        return authFetch('/api/v1/billing/subscribe', {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId }),
        });
    },

    async cancelSubscription(): Promise<void> {
        return authFetch('/api/v1/billing/cancel', { method: 'POST' });
    },

    async toggleAutoRenew(): Promise<void> {
        return authFetch('/api/v1/billing/auto-renew', { method: 'POST' });
    },
};

// ==================== PAYMENTS API ====================
export const paymentsApi = {
    async getCreditPacks(): Promise<CreditPackage[]> {
        return authFetch('/api/v1/payments/credit-packs');
    },

    async createCreditPackOrder(packId: string): Promise<{ order_id: string; amount: number }> {
        return authFetch('/api/v1/payments/credit-packs/order', {
            method: 'POST',
            body: JSON.stringify({ pack_id: packId }),
        });
    },

    async verifyCreditPackPayment(orderId: string, paymentId: string): Promise<{ credits: number }> {
        return authFetch('/api/v1/payments/credit-packs/verify', {
            method: 'POST',
            body: JSON.stringify({ order_id: orderId, payment_id: paymentId }),
        });
    },

    async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        return authFetch('/api/v1/payments/subscription-plans');
    },

    async createSubscriptionOrder(planId: string): Promise<{ order_id: string; subscription_id: string }> {
        return authFetch('/api/v1/payments/subscriptions/order', {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId }),
        });
    },

    async verifySubscriptionPayment(orderId: string, paymentId: string, subscriptionId: string): Promise<void> {
        return authFetch('/api/v1/payments/subscriptions/verify', {
            method: 'POST',
            body: JSON.stringify({ order_id: orderId, payment_id: paymentId, subscription_id: subscriptionId }),
        });
    },

    async cancelSubscription(): Promise<void> {
        return authFetch('/api/v1/payments/subscriptions/cancel', { method: 'POST' });
    },

    async toggleAutoRenew(): Promise<{ auto_renew: boolean }> {
        return authFetch('/api/v1/payments/subscriptions/auto-renew', { method: 'POST' });
    },

    async getCurrentSubscription(): Promise<{ plan: SubscriptionPlan; status: string; expires_at: string; auto_renew: boolean } | null> {
        return authFetch('/api/v1/payments/subscriptions/current');
    },

    async getBillingHistory(): Promise<BillingHistory[]> {
        return authFetch('/api/v1/payments/billing-history');
    },

    async generateInvoice(transactionId: string): Promise<{ invoice_url: string }> {
        return authFetch(`/api/v1/payments/billing-history/${transactionId}/invoice`, { method: 'POST' });
    },

    async getPaymentMethods(): Promise<import('./types').PaymentMethod[]> {
        return authFetch('/api/v1/payment-methods/');
    },

    async deletePaymentMethod(methodId: string): Promise<void> {
        return authFetch(`/api/v1/payment-methods/${methodId}`, { method: 'DELETE' });
    },
};

// ==================== CREDITS API ====================
export const creditsApi = {
    async getBalance(): Promise<{ credits: number; bonus_credits: number }> {
        return authFetch('/api/v1/credits/balance');
    },

    async getUsage(params?: { start_date?: string; end_date?: string }): Promise<{ date: string; credits_used: number }[]> {
        const searchParams = new URLSearchParams();
        if (params?.start_date) searchParams.append('start_date', params.start_date);
        if (params?.end_date) searchParams.append('end_date', params.end_date);
        return authFetch(`/api/v1/credits/usage?${searchParams.toString()}`);
    },

    async getPackages(): Promise<CreditPackage[]> {
        return authFetch('/api/v1/credits/packages');
    },

    async purchase(packageId: string): Promise<{ checkout_url: string }> {
        return authFetch('/api/v1/credits/purchase', {
            method: 'POST',
            body: JSON.stringify({ package_id: packageId }),
        });
    },

    async redeem(code: string): Promise<{ credits: number }> {
        return authFetch('/api/v1/credits/redeem', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },
};

// ==================== GENERATION API ====================
export const generationApi = {
    async getModels(): Promise<Model[]> {
        return authFetch('/api/v1/generation/models');
    },

    async getQualities(): Promise<{ id: string; name: string; credits_multiplier: number }[]> {
        return authFetch('/api/v1/generation/qualities');
    },

    async calculateCredits(data: { model: string; quality: string; count?: number }): Promise<{ credits: number }> {
        return authFetch('/api/v1/generation/calculate-credits', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async checkStatus(jobId: string): Promise<Job> {
        return authFetch(`/api/v1/generation/status?job_id=${jobId}`);
    },

    async enhancePrompt(prompt: string): Promise<{ enhanced_prompt: string }> {
        return authFetch('/api/v1/generation/enhance-prompt', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
        });
    },
};

// ==================== TOOLS API ====================
export const toolsApi = {
    async list(): Promise<Tool[]> {
        return authFetch('/api/v1/tools/');
    },

    async getUsage(): Promise<{ tool_id: string; uses: number }[]> {
        return authFetch('/api/v1/tools/usage');
    },

    async getSingleUsage(toolId: string): Promise<{ uses: number }> {
        return authFetch(`/api/v1/tools/usage/${toolId}`);
    },

    async process(toolId: string, data: Record<string, unknown>): Promise<{ result_url: string }> {
        return authFetch('/api/v1/tools/process', {
            method: 'POST',
            body: JSON.stringify({ tool_id: toolId, ...data }),
        });
    },

    async uploadAndProcess(toolId: string, file: File, options?: Record<string, unknown>): Promise<{ result_url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tool_id', toolId);
        if (options) {
            Object.entries(options).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
        }
        return uploadFetch('/api/v1/tools/upload-and-process', formData);
    },
};

// ==================== MODELS API ====================
export const modelsApi = {
    async getAll(): Promise<{ models: Model[]; tools: Tool[]; qualities: unknown[]; modes: unknown[] }> {
        return authFetch('/api/v1/models/all');
    },

    async getModels(): Promise<Model[]> {
        return authFetch('/api/v1/models/models');
    },

    async getTools(): Promise<Tool[]> {
        return authFetch('/api/v1/models/tools');
    },

    async getQualities(): Promise<unknown[]> {
        return authFetch('/api/v1/models/quality-levels');
    },

    async getModes(): Promise<unknown[]> {
        return authFetch('/api/v1/models/mode-costs');
    },
};

// ==================== REFERRAL API ====================
export const referralApi = {
    async getCode(): Promise<{ code: string; discount_percent: number }> {
        return authFetch('/api/v1/referral/code');
    },

    async apply(code: string): Promise<{ message: string }> {
        return authFetch('/api/v1/referral/apply', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },

    async getStats(): Promise<{ total_referrals: number; active_referrals: number; total_earnings: number }> {
        return authFetch('/api/v1/referral/stats');
    },

    async getRewards(): Promise<{ total_credits: number; pending_credits: number }> {
        return authFetch('/api/v1/referral/rewards');
    },

    async validate(code: string): Promise<{ valid: boolean; discount_percent?: number }> {
        return authFetch(`/api/v1/referral/validate/${code}`);
    },

    async getReferredUsers(): Promise<{ user_id: string; joined_at: string; status: string }[]> {
        return authFetch('/api/v1/referral/referred-users');
    },
};

// ==================== SUPPORT API ====================
export const supportApi = {
    async submitTicket(data: { subject: string; description: string; category?: string }): Promise<SupportTicket> {
        return authFetch('/api/v1/support/ticket', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async submitBugReport(data: { title: string; description: string; steps_to_reproduce?: string }): Promise<{ id: string }> {
        return authFetch('/api/v1/support/bug-report', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMyTickets(): Promise<SupportTicket[]> {
        return authFetch('/api/v1/support/tickets');
    },

    async getFAQ(): Promise<FAQ[]> {
        return authFetch('/api/v1/support/faq');
    },

    async getFAQCategories(): Promise<string[]> {
        return authFetch('/api/v1/support/faq/categories');
    },
};

// ==================== NOTIFICATIONS API ====================
export const notificationsApi = {
    async get(): Promise<Notification[]> {
        return authFetch('/api/v1/notifications/');
    },

    async clearAll(): Promise<void> {
        return authFetch('/api/v1/notifications/', { method: 'DELETE' });
    },

    async markAllRead(): Promise<void> {
        return authFetch('/api/v1/notifications/read-all', { method: 'POST' });
    },

    async markRead(notificationId: string): Promise<void> {
        return authFetch(`/api/v1/notifications/${notificationId}/read`, { method: 'PUT' });
    },

    async delete(notificationId: string): Promise<void> {
        return authFetch(`/api/v1/notifications/${notificationId}`, { method: 'DELETE' });
    },

    async getSettings(): Promise<{ email_marketing: boolean; email_updates: boolean; email_community: boolean; push_enabled: boolean }> {
        return authFetch('/api/v1/notifications/settings');
    },

    async updateSettings(settings: { email_marketing?: boolean; email_updates?: boolean; email_community?: boolean; push_enabled?: boolean }): Promise<void> {
        return authFetch('/api/v1/notifications/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    },
};

// ==================== ACTIVITY API ====================
export const activityApi = {
    async get(params?: { page?: number; limit?: number }): Promise<{ items: ActivityLog[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        return authFetch(`/api/v1/activity/?${searchParams.toString()}`);
    },
};

// ==================== EXPORT API ====================
export const exportApi = {
    async request(): Promise<{ export_id: string }> {
        return authFetch('/api/v1/export/', { method: 'POST' });
    },

    async getStatus(): Promise<{ status: string; progress: number; download_url?: string }> {
        return authFetch('/api/v1/export/status');
    },

    async download(): Promise<{ download_url: string }> {
        return authFetch('/api/v1/export/download');
    },
};

// ==================== EXPERIMENTAL API ====================
export const experimentalApi = {
    async getSettings(): Promise<{ features: Record<string, boolean> }> {
        return authFetch('/api/v1/experimental/settings');
    },

    async toggleFeatures(features: Record<string, boolean>): Promise<void> {
        return authFetch('/api/v1/experimental/settings/toggle', {
            method: 'POST',
            body: JSON.stringify({ features }),
        });
    },

    async listApiKeys(): Promise<{ provider: string; is_valid: boolean; created_at: string }[]> {
        return authFetch('/api/v1/experimental/api-keys');
    },

    async addApiKey(provider: string, apiKey: string): Promise<void> {
        return authFetch('/api/v1/experimental/api-keys', {
            method: 'POST',
            body: JSON.stringify({ provider, api_key: apiKey }),
        });
    },

    async deleteApiKey(provider: string): Promise<void> {
        return authFetch(`/api/v1/experimental/api-keys/${provider}`, { method: 'DELETE' });
    },

    async validateApiKey(provider: string): Promise<{ valid: boolean }> {
        return authFetch(`/api/v1/experimental/api-keys/${provider}/validate`, { method: 'POST' });
    },

    async getProviderModels(provider: string): Promise<Model[]> {
        return authFetch(`/api/v1/experimental/providers/${provider}/models`);
    },

    async importModel(modelId: string, provider: string): Promise<void> {
        return authFetch('/api/v1/experimental/models/import', {
            method: 'POST',
            body: JSON.stringify({ model_id: modelId, provider }),
        });
    },

    async listImportedModels(): Promise<Model[]> {
        return authFetch('/api/v1/experimental/models/imported');
    },

    async removeImportedModel(modelId: string): Promise<void> {
        return authFetch(`/api/v1/experimental/models/imported/${modelId}`, { method: 'DELETE' });
    },
};

// ==================== 2FA API ====================
export const twoFactorApi = {
    async setup(): Promise<{ secret: string; qr_code_url: string }> {
        return authFetch('/api/v1/auth/2fa/setup', { method: 'POST' });
    },

    async enable(code: string): Promise<{ backup_codes: string[] }> {
        return authFetch('/api/v1/auth/2fa/enable', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },

    async disable(code: string): Promise<void> {
        return authFetch('/api/v1/auth/2fa/disable', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },

    async verify(code: string): Promise<{ valid: boolean }> {
        return authFetch('/api/v1/auth/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },
};

// ==================== SESSIONS API ====================
export const sessionsApi = {
    async getAll(): Promise<{ id: string; device: string; ip_address: string; last_active: string; is_current: boolean }[]> {
        return authFetch('/api/v1/auth/sessions');
    },

    async terminate(sessionId: string): Promise<void> {
        return authFetch(`/api/v1/auth/sessions/${sessionId}`, { method: 'DELETE' });
    },

    async terminateAll(): Promise<void> {
        return authFetch('/api/v1/auth/sessions/all', { method: 'DELETE' });
    },
};

// ==================== OPENROUTER API ====================
export const openrouterApi = {
    async getModels(): Promise<{ id: string; name: string; description?: string; pricing?: { prompt: string; completion: string } }[]> {
        return authFetch('/api/v1/openrouter/models');
    },

    async getImageGenerationModels(): Promise<{ id: string; name: string; description?: string }[]> {
        return authFetch('/api/v1/openrouter/models/imagine');
    },

    async getModelInfo(modelId: string): Promise<{ id: string; name: string; description: string; pricing: unknown }> {
        return authFetch(`/api/v1/openrouter/model/${modelId}`);
    },

    async generateImage(data: { prompt: string; model: string; width?: number; height?: number }): Promise<{ image_url: string; job_id: string }> {
        return authFetch('/api/v1/openrouter/generate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async checkStatus(): Promise<{ status: string; message?: string }> {
        return authFetch('/api/v1/openrouter/status');
    },
};

// ==================== AUDIO API ====================
export const audioApi = {
    async transcribe(file: File): Promise<{ text: string; duration: number }> {
        const formData = new FormData();
        formData.append('file', file);
        return uploadFetch('/api/v1/audio/transcribe', formData);
    },
};

// ==================== PROFILE API ====================
export const profileApi = {
    async get(): Promise<{
        id: string;
        email: string;
        username: string;
        full_name: string;
        dob?: string;
        email_confirmed: boolean;
        credits: number;
        newsletter_opt_in: boolean;
        profile_photo_asset_id?: string;
        created_at?: string;
        is_verified: boolean;
        is_public: boolean;
        plan: string;
    }> {
        return authFetch('/api/v1/profile/');
    },

    async update(data: {
        username?: string;
        full_name?: string;
        dob?: string;
        newsletter_opt_in?: boolean;
        is_public?: boolean;
    }): Promise<void> {
        return authFetch('/api/v1/profile/', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(): Promise<void> {
        return authFetch('/api/v1/profile/', { method: 'DELETE' });
    },

    async uploadAvatar(file: File): Promise<{ url: string; asset_id: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return uploadFetch('/api/v1/profile/avatar', formData);
    },

    async deleteAvatar(): Promise<void> {
        return authFetch('/api/v1/profile/avatar', { method: 'DELETE' });
    },
};

// ==================== JOBS API ====================
export const jobsApi = {
    async create(data: { project_id: string; prompt: string; model?: string; quality?: string }): Promise<Job> {
        return authFetch('/api/v1/jobs/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async get(jobId: string): Promise<Job> {
        return authFetch(`/api/v1/jobs/${jobId}`);
    },

    async getAvailableModels(jobId: string): Promise<Model[]> {
        return authFetch(`/api/v1/jobs/${jobId}/models`);
    },
};

// ==================== PAYMENT METHODS API ====================
export const paymentMethodsApi = {
    async get(): Promise<{ id: string; type: string; last4?: string; expiry?: string; is_default: boolean }[]> {
        return authFetch('/api/v1/payment-methods/');
    },

    async delete(methodId: string): Promise<void> {
        return authFetch(`/api/v1/payment-methods/${methodId}`, { method: 'DELETE' });
    },
};
