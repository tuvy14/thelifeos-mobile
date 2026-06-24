// Cloud sync — mirrors the web app's `user_state` design so the SAME account
// syncs across web + mobile. The synced document is { shortKey: rawJsonString }
// for each lifeos_ slice (see store SYNC_KEYS). updated_at is stamped server-side
// (trigger) so "who's newer" never depends on a device clock.
//
// NON-DESTRUCTIVE: push MERGES our keys into the remote doc (never drops keys the
// web app owns but mobile doesn't), and apply only overlays the keys we know.
// Everything no-ops cleanly when Supabase isn't configured.
/* eslint-disable @typescript-eslint/no-explicit-any */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import type { Session } from "@supabase/supabase-js";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/lib/store";

const TABLE = "user_state";
const K_WM = "lifeos_sync_at";
const PUSH_DEBOUNCE = 1200;

type RemoteState = { data: Record<string, string>; updatedAt: number };

async function currentUid(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}

async function pullRemote(): Promise<RemoteState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await sb
    .from(TABLE)
    .select("data, updated_at")
    .eq("user_id", uid)
    .maybeSingle();
  if (error || !data) return null;
  return {
    data: (data.data as Record<string, string>) || {},
    updatedAt: new Date(data.updated_at as string).getTime(),
  };
}

/** Merge our local keys over whatever is in the remote doc, then upsert. */
async function pushMerged(local: Record<string, string>): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = await currentUid();
  if (!uid) return null;
  const remote = await pullRemote();
  const merged = { ...(remote?.data || {}), ...local };
  const { data, error } = await sb
    .from(TABLE)
    .upsert({ user_id: uid, data: merged }, { onConflict: "user_id" })
    .select("updated_at")
    .single();
  if (error || !data) return null;
  return new Date(data.updated_at as string).getTime();
}

const getWatermark = async (): Promise<number> => {
  const v = await AsyncStorage.getItem(K_WM);
  return v ? Number(v) || 0 : 0;
};
const setWatermark = (ms: number) => AsyncStorage.setItem(K_WM, String(ms)).catch(() => {});

export type SyncStatus = "disabled" | "signedOut" | "syncing" | "synced" | "error";

interface SyncCtx {
  configured: boolean;
  email: string | null;
  status: SyncStatus;
  lastSyncedAt: number | null;
  appleAvailable: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; error?: string; needsConfirm?: boolean }>;
  signInWithApple: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  backupNow: () => Promise<{ ok: boolean; error?: string }>;
  restoreNow: () => Promise<{ ok: boolean; error?: string }>;
}

const Ctx = createContext<SyncCtx | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { ready, exportRaw, importRaw } = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? "signedOut" : "disabled"
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const skipNextPush = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconciling = useRef(false);

  // Track the auth session.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setStatus("signedOut");
    });
    return () => subscription.unsubscribe();
  }, []);

  // Is native "Sign in with Apple" usable here? True only on a real iOS build
  // whose App ID has the capability — false in Expo Go / on Android, so the
  // button stays hidden until the dev build + Apple config exist.
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  // Whole-document last-write-wins, mirroring the web engine.
  const reconcile = useCallback(async () => {
    if (!session || reconciling.current) return;
    reconciling.current = true;
    setStatus("syncing");
    try {
      const remote = await pullRemote();
      const wm = await getWatermark();
      if (!remote) {
        const ms = await pushMerged(exportRaw());
        if (ms) {
          setWatermark(ms);
          setLastSyncedAt(ms);
        }
      } else if (remote.updatedAt > wm) {
        skipNextPush.current = true;
        importRaw(remote.data);
        setWatermark(remote.updatedAt);
        setLastSyncedAt(remote.updatedAt);
      } else {
        const ms = await pushMerged(exportRaw());
        if (ms) {
          setWatermark(ms);
          setLastSyncedAt(ms);
        }
      }
      setStatus("synced");
    } catch {
      setStatus("error");
    } finally {
      reconciling.current = false;
    }
  }, [session, exportRaw, importRaw]);

  // Reconcile on sign-in and once data is hydrated.
  useEffect(() => {
    if (ready && session) reconcile();
  }, [ready, session, reconcile]);

  // Reconcile when the app returns to the foreground (cheap cross-device pull).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && session && ready) reconcile();
    });
    return () => sub.remove();
  }, [session, ready, reconcile]);

  // Debounced push whenever local data changes (exportRaw identity tracks it).
  useEffect(() => {
    if (!session || !ready) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      const ms = await pushMerged(exportRaw());
      if (ms) {
        setWatermark(ms);
        setLastSyncedAt(ms);
        setStatus("synced");
      }
    }, PUSH_DEBOUNCE);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [exportRaw, session, ready]);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Cloud sync isn't configured." };
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Cloud sync isn't configured." };
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    if (error) return { ok: false, error: error.message };
    // If email confirmation is on, there's a user but no active session yet.
    const needsConfirm = !data.session;
    return { ok: true, needsConfirm };
  }, []);

  // Native Sign in with Apple → exchange Apple's identity token for a Supabase
  // session (signInWithIdToken). Cancelling the sheet returns ok:false with no
  // error, so the UI stays quiet. Requires the Apple provider enabled in
  // Supabase with com.thelifeos.app in its Client IDs list.
  const signInWithApple = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Cloud sync isn't configured." };
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) return { ok: false, error: "Apple didn't return an identity token." };
      const { error } = await sb.auth.signInWithIdToken({
        provider: "apple",
        token: cred.identityToken,
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === "ERR_REQUEST_CANCELED") return { ok: false }; // user backed out
      return { ok: false, error: "Apple sign-in failed. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    await AsyncStorage.removeItem(K_WM);
    setLastSyncedAt(null);
  }, []);

  const backupNow = useCallback(async () => {
    if (!session) return { ok: false, error: "Sign in to sync." };
    const ms = await pushMerged(exportRaw());
    if (!ms) return { ok: false, error: "Backup failed." };
    setWatermark(ms);
    setLastSyncedAt(ms);
    setStatus("synced");
    return { ok: true };
  }, [session, exportRaw]);

  const restoreNow = useCallback(async () => {
    if (!session) return { ok: false, error: "Sign in to sync." };
    const remote = await pullRemote();
    if (!remote) return { ok: false, error: "No cloud backup found yet." };
    skipNextPush.current = true;
    importRaw(remote.data);
    setWatermark(remote.updatedAt);
    setLastSyncedAt(remote.updatedAt);
    setStatus("synced");
    return { ok: true };
  }, [session, importRaw]);

  const value = useMemo<SyncCtx>(
    () => ({
      configured: isSupabaseConfigured,
      email: session?.user?.email ?? null,
      status,
      lastSyncedAt,
      appleAvailable,
      signIn,
      signUp,
      signInWithApple,
      signOut,
      backupNow,
      restoreNow,
    }),
    [session, status, lastSyncedAt, appleAvailable, signIn, signUp, signInWithApple, signOut, backupNow, restoreNow]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSync(): SyncCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
