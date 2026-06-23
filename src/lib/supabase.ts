import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True only once the public Supabase env is present. Sync/auth is gated on this
 *  so the app runs fully local (no account, no cloud) without it configured. */
export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

/** Supabase client (singleton). null until env is configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anon as string, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // no URL-based sessions on native
      },
    });
  }
  return client;
}
