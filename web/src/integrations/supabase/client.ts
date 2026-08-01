import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Supabase client for the SDO Batangas LRMS.
 *
 * The portal has a single hardcoded administrator and public viewers, so we use
 * the anon key with permissive RLS policies (read for everyone, write for the
 * anon role). Auth is handled client-side through the existing division
 * credentials — there is no per-user Supabase Auth session.
 *
 * Realtime is enabled so updates made in one browser are delivered instantly to
 * every other browser or device viewing the portal.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { timeout: 20000 },
    })
  : null;

/** Storage bucket name for uploaded learning resource files. */
export const RESOURCES_BUCKET = "resources";

/** Single shared viewer id for public bookmarks and collections. */
export const VIEWER_ID = "public";
