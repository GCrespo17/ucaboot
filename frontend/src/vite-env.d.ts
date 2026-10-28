/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Public backend URL when it's on another domain (e.g. https://api.example.com).
  // Unset = same origin (local, through nginx).
  readonly VITE_API_URL?: string;
  // Supabase project URL. Unset = same origin (local Auth container behind nginx).
  readonly VITE_SUPABASE_URL?: string;
  // Supabase project's anon key (locally any value works)
  // Sin ella la app carga, pero el inicio de sesión queda deshabilitado
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
