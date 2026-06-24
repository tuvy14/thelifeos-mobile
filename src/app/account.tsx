import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";

import { SubScreen } from "@/components/sub-screen";
import { Card, Field, PrimaryButton } from "@/components/ui";
import { PressableScale } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useSync } from "@/lib/sync";

export default function AccountScreen() {
  const { configured, email, status, lastSyncedAt, appleAvailable, signIn, signUp, signInWithApple, signOut, backupNow, restoreNow } = useSync();
  const { c, isDark } = useTheme();
  const s = makeStyles(c);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const note = (t: string, isErr = false) => { setMsg(t); setErr(isErr); };

  const submit = async () => {
    if (!emailInput.trim() || !password) return note("Enter your email and password.", true);
    if (mode === "signup" && password.length < 6) return note("Password must be at least 6 characters.", true);
    setBusy(true); setMsg(null);
    const res = mode === "signin" ? await signIn(emailInput, password) : await signUp(emailInput, password);
    setBusy(false);
    if (!res.ok) return note(res.error || "Something went wrong.", true);
    if (mode === "signup" && (res as { needsConfirm?: boolean }).needsConfirm) {
      setMode("signin");
      return note("Account created. Check your email to confirm, then sign in.");
    }
  };
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => {
    setBusy(true); setMsg(null);
    const res = await fn();
    setBusy(false);
    note(res.ok ? ok : res.error || "Failed.", !res.ok);
  };
  const onApple = async () => {
    setBusy(true); setMsg(null);
    const res = await signInWithApple();
    setBusy(false);
    if (!res.ok && res.error) note(res.error, true); // cancel → no error → stay quiet
  };

  if (!configured) {
    return (
      <SubScreen eyebrow="Across your devices" title="Cloud sync">
        <Card style={{ marginTop: 4 }}>
          <Ionicons name="cloud-offline-outline" size={26} color={c.inkMuted} />
          <Text style={s.offTitle}>Not set up yet</Text>
          <Text style={s.offText}>Cloud sync needs a Supabase URL and anon key in .env.local. Until then everything stays safely on this device.</Text>
        </Card>
      </SubScreen>
    );
  }

  if (email) {
    return (
      <SubScreen eyebrow="Across your devices" title="Cloud sync">
        <Card style={{ marginTop: 4 }}>
          <View style={s.acctRow}>
            <View style={[s.avatar, { backgroundColor: c.ink }]}>
              <Ionicons name="person" size={18} color={c.obsidian} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.email}>{email}</Text>
              <Text style={s.statusLine}>{status === "syncing" ? "Syncing…" : `Synced ${relTime(lastSyncedAt)}`}</Text>
            </View>
            {status === "syncing" && <ActivityIndicator color={c.inkMuted} />}
          </View>
        </Card>

        <Text style={s.sectionNote}>Your data syncs automatically on open and after every change. You can also do it by hand:</Text>
        <View style={{ gap: 10 }}>
          <PressableScale style={s.action} disabled={busy} onPress={() => run(backupNow, "Backed up to the cloud.")}>
            <Ionicons name="cloud-upload-outline" size={18} color={c.ink} />
            <Text style={s.actionText}>Back up now</Text>
          </PressableScale>
          <PressableScale style={s.action} disabled={busy} onPress={() => run(restoreNow, "Restored from the cloud.")}>
            <Ionicons name="cloud-download-outline" size={18} color={c.ink} />
            <Text style={s.actionText}>Restore from cloud</Text>
          </PressableScale>
        </View>
        {msg && <Text style={[s.msg, err && { color: c.danger }]}>{msg}</Text>}
        <PressableScale style={s.signOut} disabled={busy} onPress={signOut}>
          <Text style={s.signOutText}>Sign out</Text>
        </PressableScale>
      </SubScreen>
    );
  }

  return (
    <SubScreen eyebrow="Across your devices" title="Cloud sync">
      <Text style={s.lead}>Sign in to back up your life and sync it across every device — same account as the web app.</Text>
      <View style={[s.segment, { borderColor: c.line, backgroundColor: c.fill }]}>
        {(["signin", "signup"] as const).map((m) => (
          <PressableScale key={m} style={[s.segBtn, mode === m && { backgroundColor: c.ink }]} onPress={() => setMode(m)}>
            <Text style={[s.segText, { color: mode === m ? c.obsidian : c.inkMuted }]}>{m === "signin" ? "Sign in" : "Create account"}</Text>
          </PressableScale>
        ))}
      </View>
      <Card style={{ gap: 10 }}>
        <Field value={emailInput} onChangeText={setEmailInput} placeholder="you@email.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        <Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry returnKeyType="done" onSubmitEditing={submit} />
        <PrimaryButton label={busy ? "…" : mode === "signin" ? "Sign in" : "Create account"} onPress={submit} disabled={busy} style={{ marginTop: 4 }} />
      </Card>

      {appleAvailable && (
        <>
          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>or</Text>
            <View style={s.orLine} />
          </View>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={radius.lg}
            style={s.appleBtn}
            onPress={onApple}
          />
        </>
      )}

      {msg && <Text style={[s.msg, err && { color: c.danger }]}>{msg}</Text>}
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    lead: { fontFamily: fonts.body, fontSize: 14, color: c.inkMuted, lineHeight: 21, marginBottom: 16 },
    offTitle: { fontFamily: fonts.display, fontSize: 16, color: c.ink, marginTop: 12 },
    offText: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, lineHeight: 20, marginTop: 6 },
    acctRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
    email: { fontFamily: fonts.bodySemibold, fontSize: 15, color: c.ink },
    statusLine: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint, marginTop: 2 },
    sectionNote: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, lineHeight: 20, marginTop: 18, marginBottom: 12 },
    action: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, padding: 16 },
    actionText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: c.ink },
    signOut: { borderWidth: 1, borderColor: c.lineStrong, borderRadius: radius.lg, paddingVertical: 14, alignItems: "center", marginTop: 22 },
    signOutText: { fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink },
    segment: { flexDirection: "row", borderWidth: 1, borderRadius: radius.md, padding: 4, marginBottom: 14 },
    segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: "center" },
    segText: { fontFamily: fonts.bodyBold, fontSize: 13 },
    msg: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, lineHeight: 19, marginTop: 14, textAlign: "center" },
    orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 },
    orLine: { flex: 1, height: 1, backgroundColor: c.line },
    orText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 0.6, color: c.inkFaint, textTransform: "uppercase" },
    appleBtn: { height: 52, width: "100%" },
  });
