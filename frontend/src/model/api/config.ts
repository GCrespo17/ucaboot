const trimSlash = (url: string) => url.replace(/\/+$/, "");

// Backend base URL. Empty = same origin (relative paths: /api, /socket.io).
export const API_URL = trimSlash(import.meta.env.VITE_API_URL ?? "");

// Supabase project URL. Unset = same origin: locally nginx routes /auth/v1 to the Auth container.
export const SUPABASE_URL = trimSlash(import.meta.env.VITE_SUPABASE_URL || window.location.origin);
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
