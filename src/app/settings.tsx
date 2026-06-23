import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { PressableScale } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";

export default function SettingsScreen() {
  const { logs, wins, habits, goals, journal, workouts, revenue, expenses, calendar, resetAll, resetOnboarding } = useStore();
  const { c, isDark, toggle } = useTheme();
  const { configured, email, status } = useSync();
  const s = makeStyles(c);

  const syncSub = !configured
    ? "Local only — not configured"
    : email
      ? status === "syncing" ? "Syncing…" : `Signed in · ${email}`
      : "Sign in to sync your devices";

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
        <View style={[s.dataRow, { borderBottomWidth: 1, borderBottomColor: c.line }]}>
          <Text style={s.dataLabel}>Version</Text><Text style={s.dataValue}>1.0.0</Text>
        </View>
        <View style={s.dataRow}>
          <Text style={s.dataLabel}>Made for</Text><Text style={s.dataValue}>small wins</Text>
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
