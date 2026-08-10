import { storage } from '@/src/utils/storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const TOKEN_KEY = 'krishiva_token';

export async function getToken(): Promise<string | null> {
  return await storage.secureGet(TOKEN_KEY, null);
}
export async function setToken(t: string) { await storage.secureSet(TOKEN_KEY, t); }
export async function clearToken() { await storage.secureRemove(TOKEN_KEY); }

async function req(path: string, opts: RequestInit = {}, auth = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (auth) {
    const t = await getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = (data && data.detail) || `HTTP ${res.status}`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
}

export const api = {
  base: BASE,
  register: (body: any) => req('/auth/register', { method: 'POST', body: JSON.stringify(body) }, false),
  login: (body: any) => req('/auth/login', { method: 'POST', body: JSON.stringify(body) }, false),
  forgotPassword: (identifier: string) => req('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }, false),
  resetPassword: (identifier: string, otp: string, new_password: string) => req('/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier, otp, new_password }) }, false),
  me: () => req('/auth/me'),
  updateMe: (body: any) => req('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  getUser: (id: string) => req(`/users/${id}`),
  searchUsers: (q: string) => req(`/users?q=${encodeURIComponent(q)}`),
  toggleFollow: (id: string) => req(`/users/${id}/follow`, { method: 'POST' }),

  listPosts: (tag?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (tag && tag !== 'all') params.set('tag', tag);
    if (userId) params.set('user_id', userId);
    const qs = params.toString();
    return req(`/posts${qs ? `?${qs}` : ''}`);
  },
  createPost: (body: any) => req('/posts', { method: 'POST', body: JSON.stringify(body) }),
  toggleLike: (id: string) => req(`/posts/${id}/like`, { method: 'POST' }),
  deletePost: (id: string) => req(`/posts/${id}`, { method: 'DELETE' }),
  listComments: (id: string) => req(`/posts/${id}/comments`),
  addComment: (id: string, text: string) => req(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  listConversations: () => req('/conversations'),
  listMessages: (otherId: string) => req(`/conversations/${otherId}/messages`),
  sendMessage: (to_user_id: string, text: string) => req('/messages', { method: 'POST', body: JSON.stringify({ to_user_id, text }) }),

  // Marketplace
  getCategories: () => req('/categories'),
  listProducts: (categoryId?: string) => req(`/products${categoryId ? `?category_id=${categoryId}` : ''}`),
  getProduct: (id: string) => req(`/products/${id}`),
  listOrders: () => req('/orders'),

  listArticles: () => req('/articles'),
  getArticle: (id: string) => req(`/articles/${id}`),

  aiChat: async (message: string, session_id?: string, images?: string[], video_media_id?: string) => {
    return req('/ai/chat_sync', { method: 'POST', body: JSON.stringify({ message, session_id, images, video_media_id }) });
  },
  aiHistory: (session_id?: string) => req(`/ai/history${session_id ? `?session_id=${session_id}` : ''}`),

  // Notifications
  listNotifications: () => req('/notifications'),
  notificationUnreadCount: () => req('/notifications/unread_count'),
  markAllRead: () => req('/notifications/read_all', { method: 'POST' }),
  markOneRead: (id: string) => req(`/notifications/${id}/read`, { method: 'POST' }),

  // Subscription & payments
  getPlans: () => req('/subscriptions/plans', {}, false),
  mySubscription: () => req('/subscriptions/me'),
  createOrder: (plan_id: string) => req('/payments/order', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  createPaymentLink: (plan_id: string) => req('/payments/payment-link', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  verifyPayment: (body: any) => req('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
  devActivate: (plan_id: string) => req('/payments/dev-activate', { method: 'POST', body: JSON.stringify({ plan_id }) }),

  // Chunked media upload (videos)
  uploadMedia: async (base64: string, mime: string, onProgress?: (p: number) => void): Promise<{ id: string; url: string }> => {
    const { id } = await req('/media/start', { method: 'POST', body: JSON.stringify({ mime }) });
    const CHUNK = 512 * 1024; // base64 chars per chunk (multiple of 4)
    let idx = 0;
    for (let i = 0; i < base64.length; i += CHUNK, idx++) {
      await req(`/media/${id}/chunk`, { method: 'POST', body: JSON.stringify({ index: idx, data: base64.slice(i, i + CHUNK) }) });
      onProgress?.(Math.min(1, (i + CHUNK) / base64.length));
    }
    const fin = await req(`/media/${id}/finish`, { method: 'POST' });
    return fin;
  },
};
