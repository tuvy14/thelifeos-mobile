import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { PressableScale } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, isPaid, trialDaysLeft } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { useFeedbackPrefs, setSoundEnabled, setHapticsEnabled, haptic, playSfx } from "@/lib/feedback";

export default function SettingsScreen() {
  const { logs, wins, habits, goals, journal, workouts, revenue, expenses, calendar, profile, resetAll, resetOnboarding } = useStore();
  const { c, isDark, toggle } = useTheme();
  const { configured, email, status } = useSync();
  const fb = useFeedbackPrefs();
  const s = makeStyles(c);

  const syncSub = !configured
    ? "Local only — not configured"
    : email
      ? status === "syncing" ? "Syncing…" : `Signed in · ${email}`
      : "Sign in to sync your devices";

  // Plan row state (mirrors the entitlement model).
  const paid = isPaid(profile); // admin / lifetime / monthly
  const onTrial = profile?.plan === "trial";
  const trialLeft = trialDaysLeft(profile);
  const planActive = paid || onTrial;
  const planTitle = paid ? "TheLifeOS Pro" : onTrial ? "Pro trial" : "Upgrade to Pro";
  const planSub =
    profile?.admin || profile?.plan === "lifetime"
      ? "Lifetime access · active"
      : profile?.plan === "monthly"
        ? "Pro monthly · active"
        : onTrial
          ? `${trialLeft} day${trialLeft === 1 ? "" : "s"} left · tap to manage`
          : "Lifetime $200 · or $15/mo";

  const counts = [
    { label: "Check-ins", value: logs.length },
    { label: "Wins", value: wins.length },
    { label: "Habits", value: habits.length },
    { label: "Goals", value: goals.length },
    { label: "Journal", value: journal.length },
    { label: "Workouts", value: workouts.length },
    { label: "Revenue entries", value: revenue.length },
    { label: "Expenses", value: expenses.length },
    { label: "Calendar", value: calendar.length },
  ];

  const confirmReset = () => {
    Alert.alert(
      "Reset everything?",
      "This permanently erases all your data on this device. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Erase all", style: "destructive", onPress: () => resetAll() },
      ]
    );
  };

  return (
    <SubScreen eyebrow="Control panel" title="Settings">
      <Text style={s.section}>APPEARANCE</Text>
      <PressableScale style={s.row} onPress={toggle}>
        <View style={[s.icon, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={c.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Theme</Text>
          <Text style={s.rowSub}>{isDark ? "Dark" : "Light"} · tap to switch</Text>
        </View>
        <View style={[s.toggle, { backgroundColor: isDark ? c.fillStrong : c.ink }]}>
          <View style={[s.knob, { backgroundColor: isDark ? c.ink : c.obsidian, alignSelf: isDark ? "flex-start" : "flex-end" }]} />
        </View>
      </PressableScale>

      <Text style={s.section}>FEEDBACK</Text>
      <PressableScale
        style={s.row}
        haptics={false}
        onPress={() => { const next = !fb.sound; setSoundEnabled(next); if (next) playSfx("success"); }}
      >
        <View style={[s.icon, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name={fb.sound ? "volume-high" : "volume-mute"} size={18} color={c.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Sound effects</Text>
          <Text style={s.rowSub}>{fb.sound ? "On · subtle chimes" : "Off · silent"}</Text>
        </View>
        <View style={[s.toggle, { backgroundColor: fb.sound ? c.ink : c.fillStrong }]}>
          <View style={[s.knob, { backgroundColor: fb.sound ? c.obsidian : c.ink, alignSelf: fb.sound ? "flex-end" : "flex-start" }]} />
        </View>
      </PressableScale>
      <PressableScale
        style={[s.row, { marginTop: 10 }]}
        haptics={false}
        onPress={() => { const next = !fb.haptics; setHapticsEnabled(next); if (next) haptic("medium"); }}
      >
        <View style={[s.icon, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name="pulse" size={18} color={c.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Haptics</Text>
          <Text style={s.rowSub}>{fb.haptics ? "On · taps & buzzes" : "Off"}</Text>
        </View>
        <View style={[s.toggle, { backgroundColor: fb.haptics ? c.ink : c.fillStrong }]}>
          <View style={[s.knob, { backgroundColor: fb.haptics ? c.obsidian : c.ink, alignSelf: fb.haptics ? "flex-end" : "flex-start" }]} />
        </View>
      </PressableScale>

      <Text style={s.section}>PLAN</Text>
      <PressableScale style={[s.row, !planActive && { borderColor: c.ink }]} onPress={() => router.navigate("/upgrade")}>
        <View style={[s.icon, { borderColor: planActive ? c.line : c.ink, backgroundColor: planActive ? c.fill : c.ink }]}>
          <Ionicons name="sparkles" size={18} color={planActive ? c.ink : c.obsidian} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>{planTitle}</Text>
          <Text style={s.rowSub}>{planSub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
      </PressableScale>

      <Text style={s.section}>SYNC</Text>
      <PressableScale style={s.row} onPress={() => router.navigate("/account")}>
        <View style={[s.icon, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name={email ? "cloud-done-outline" : "cloud-outline"} size={18} color={c.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Cloud sync</Text>
          <Text style={s.rowSub}>{syncSub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
      </PressableScale>

      <Text style={s.section}>YOUR DATA</Text>
      <Card padding={4}>
        {counts.map((ct, i) => (
          <View key={ct.label} style={[s.dataRow, i < counts.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <Text style={s.dataLabel}>{ct.label}</Text>
            <Text style={s.dataValue}>{ct.value}</Text>
          </View>
        ))}
      </Card>

      <View style={[s.note, { borderColor: c.line, backgroundColor: c.card }]}>
        <Ionicons name="lock-closed-outline" size={16} color={c.inkMuted} />
        <Text style={s.noteText}>
          Your data lives on this device. Sign in to back it up and sync it across your devices — same account as the web app.
        </Text>
      </View>

      <Text style={s.section}>ABOUT</Text>
      <Card padding={4}>
        <View style={s.dataRow}>
          <Text style={s.dataLabel}>Version</Text><Text style={s.dataValue}>1.0.0</Text>
        </View>
      </Card>

      <PressableScale style={[s.danger, { borderColor: c.lineStrong }]} onPress={() => Alert.alert("Redo onboarding?", "This clears your focus areas and shows the welcome flow again. Your data stays.", [{ text: "Cancel", style: "cancel" }, { text: "Redo", onPress: () => resetOnboarding() }])}>
        <Ionicons name="refresh-outline" size={16} color={c.ink} />
        <Text style={s.dangerText}>Redo onboarding</Text>
      </PressableScale>
      <PressableScale style={[s.danger, { borderColor: c.lineStrong, marginTop: 10 }]} onPress={confirmReset}>
        <Ionicons name="trash-outline" size={16} color={c.danger} />
        <Text style={[s.dangerText, { color: c.danger }]}>Reset all data</Text>
      </PressableScale>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    section: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: c.inkFaint, marginTop: 22, marginBottom: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: 16 },
    icon: { width: 42, height: 42, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    rowTitle: { fontFamily: fonts.bodySemibold, fontSize: 16, color: c.ink },
    rowSub: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint, marginTop: 2 },
    toggle: { width: 46, height: 27, borderRadius: 14, padding: 3, justifyContent: "center" },
    knob: { width: 21, height: 21, borderRadius: 11 },
    dataRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14 },
    dataLabel: { fontFamily: fonts.body, fontSize: 14, color: c.inkMuted },
    dataValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: c.ink },
    note: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: radius.md, padding: 14, marginTop: 14 },
    noteText: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, lineHeight: 19, flex: 1 },
    danger: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: radius.lg, paddingVertical: 15, marginTop: 14 },
    dangerText: { fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink },
  });
