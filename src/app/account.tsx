import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { theme, radius } from "@/lib/theme";
import { useSync } from "@/lib/sync";

export default function AccountScreen() {
  const { configured, email, status, lastSyncedAt, signIn, signUp, signOut, backupNow, restoreNow } =
    useSync();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const note = (text: string, isErr = false) => {
    setMsg(text);
    setErr(isErr);
  };

  const submit = async () => {
    if (!emailInput.trim() || !password) return note("Enter your email and password.", true);
    if (mode === "signup" && password.length < 6)
      return note("Password must be at least 6 characters.", true);
    setBusy(true);
    setMsg(null);
    const res = mode === "signin" ? await signIn(emailInput, password) : await signUp(emailInput, password);
    setBusy(false);
    if (!res.ok) return note(res.error || "Something went wrong.", true);
    if (mode === "signup" && (res as any).needsConfirm) {
      setMode("signin");
      return note("Account created. Check your email to confirm, then sign in.");
    }
    // Signed in — the auth listener flips this screen to the account view.
  };

  const runAction = async (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setBusy(true);
    setMsg(null);
    const res = await fn();
    setBusy(false);
    note(res.ok ? okMsg : res.error || "Failed.", !res.ok);
  };

  if (!configured) {
    return (
      <SubScreen eyebrow="ACROSS YOUR DEVICES" title="Cloud sync">
        <View style={styles.card}>
          <Ionicons name="cloud-offline-outline" size={26} color={theme.inkMuted} />
          <Text style={styles.offTitle}>Not set up yet</Text>
          <Text style={styles.offText}>
            Cloud sync needs a Supabase URL and anon key in your .env.local. Until then everything
            stays safely on this device.
          </Text>
        </View>
      </SubScreen>
    );
  }

  // ── Signed in ──
  if (email) {
    return (
      <SubScreen eyebrow="ACROSS YOUR DEVICES" title="Cloud sync">
        <View style={styles.card}>
          <View style={styles.accountRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color={theme.obsidian} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.email}>{email}</Text>
              <Text style={styles.statusLine}>
                {status === "syncing" ? "Syncing…" : `Synced ${relTime(lastSyncedAt)}`}
              </Text>
            </View>
            {status === "syncing" && <ActivityIndicator color={theme.inkMuted} />}
          </View>
        </View>

        <Text style={styles.sectionNote}>
          Your data syncs automatically when the app opens and after every change. You can also do it
          by hand:
        </Text>

        <View style={{ gap: 10 }}>
          <Pressable
            style={styles.action}
            disabled={busy}
            onPress={() => runAction(backupNow, "Backed up to the cloud.")}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={theme.ink} />
            <Text style={styles.actionText}>Back up now</Text>
          </Pressable>
          <Pressable
            style={styles.action}
            disabled={busy}
            onPress={() => runAction(restoreNow, "Restored from the cloud.")}
          >
            <Ionicons name="cloud-download-outline" size={18} color={theme.ink} />
            <Text style={styles.actionText}>Restore from cloud</Text>
          </Pressable>
        </View>

        {msg && <Text style={[styles.msg, err && styles.msgErr]}>{msg}</Text>}

        <Pressable style={styles.signOut} disabled={busy} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </SubScreen>
    );
  }

  // ── Signed out ──
  return (
    <SubScreen eyebrow="ACROSS YOUR DEVICES" title="Cloud sync">
      <Text style={styles.sub}>
        Sign in to back up your life and sync it across every device — same account as the web app.
      </Text>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segBtn, mode === "signin" && styles.segOn]}
          onPress={() => setMode("signin")}
        >
          <Text style={[styles.segText, mode === "signin" && styles.segTextOn]}>Sign in</Text>
        </Pressable>
        <Pressable
          style={[styles.segBtn, mode === "signup" && styles.segOn]}
          onPress={() => setMode("signup")}
        >
          <Text style={[styles.segText, mode === "signup" && styles.segTextOn]}>Create account</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <TextInput
          value={emailInput}
          onChangeText={setEmailInput}
          placeholder="you@email.com"
          placeholderTextColor={theme.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.inkFaint}
          secureTextEntry
          style={[styles.input, { marginTop: 10 }]}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Pressable style={styles.primary} disabled={busy} onPress={submit}>
          {busy ? (
            <ActivityIndicator color={theme.obsidian} />
          ) : (
            <Text style={styles.primaryText}>{mode === "signin" ? "Sign in" : "Create account"}</Text>
          )}
        </Pressable>
      </View>

      {msg && <Text style={[styles.msg, err && styles.msgErr]}>{msg}</Text>}
    </SubScreen>
  );
}

function relTime(ms: number | null): string {
  if (!ms) return "just now";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const styles = StyleSheet.create({
  sub: { color: theme.inkMuted, fontSize: 14, lineHeight: 21, marginBottom: 18 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 18,
  },
  offTitle: { color: theme.ink, fontSize: 16, fontWeight: "700", marginTop: 12 },
  offText: { color: theme.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  email: { color: theme.ink, fontSize: 15, fontWeight: "700" },
  statusLine: { color: theme.inkFaint, fontSize: 12, marginTop: 2 },
  sectionNote: { color: theme.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 18, marginBottom: 12 },
  action: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  actionText: { color: theme.ink, fontSize: 15, fontWeight: "600" },
  signOut: {
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 22,
  },
  signOutText: { color: theme.ink, fontSize: 15, fontWeight: "700" },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 4,
    marginBottom: 14,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: "center" },
  segOn: { backgroundColor: theme.ink },
  segText: { color: theme.inkMuted, fontSize: 13, fontWeight: "700" },
  segTextOn: { color: theme.obsidian },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.ink,
    fontSize: 14,
  },
  primary: {
    backgroundColor: theme.ink,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 14,
  },
  primaryText: { color: theme.obsidian, fontSize: 15, fontWeight: "800" },
  msg: { color: theme.inkMuted, fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: "center" },
  msgErr: { color: "#ff6b6b" },
});
