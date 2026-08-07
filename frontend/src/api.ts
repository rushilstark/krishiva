import { storage } from '@/src/utils/storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
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
  forgotPassword: (email: string) => req('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false),
  resetPassword: (email: string, otp: string, new_password: string) => req('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, new_password }) }, false),
  me: () => req('/auth/me'),
  updateMe: (body: any) => req('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  getUser: (id: string) => req(`/users/${id}`),
  searchUsers: (q: string) => req(`/users?q=${encodeURIComponent(q)}`),

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

  listArticles: () => req('/articles'),
  getArticle: (id: string) => req(`/articles/${id}`),

  aiChat: async (message: string, session_id?: string) => {
    return req('/ai/chat_sync', { method: 'POST', body: JSON.stringify({ message, session_id }) });
  },
  aiHistory: (session_id?: string) => req(`/ai/history${session_id ? `?session_id=${session_id}` : ''}`),
};
