import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { theme, radius } from "@/lib/theme";
import { useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";

export default function SettingsScreen() {
  const { logs, wins, habits, goals, journal, money, resetAll } = useStore();
  const { configured, email, status } = useSync();

  const syncSub = !configured
    ? "Local only — not configured"
    : email
      ? status === "syncing"
        ? "Syncing…"
        : `Signed in · ${email}`
      : "Sign in to sync your devices";

  const counts = [
    { label: "Check-ins", value: logs.length },
    { label: "Wins", value: wins.length },
    { label: "Habits", value: habits.length },
    { label: "Goals", value: goals.length },
    { label: "Journal entries", value: journal.length },
    { label: "Transactions", value: money.length },
  ];

  const confirmReset = () => {
    Alert.alert(
      "Reset everything?",
      "This permanently erases all your check-ins, wins, habits, goals, journal entries and transactions on this device. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Erase all", style: "destructive", onPress: () => resetAll() },
      ]
    );
  };

  return (
    <SubScreen eyebrow="THE CONTROL PANEL" title="Settings">
      <Text style={styles.section}>YOUR DATA</Text>
      <View style={styles.card}>
        {counts.map((c, i) => (
          <View key={c.label} style={[styles.dataRow, i < counts.length - 1 && styles.divider]}>
            <Text style={styles.dataLabel}>{c.label}</Text>
            <Text style={styles.dataValue}>{c.value}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.syncRow} onPress={() => router.navigate("/account")}>
        <View style={styles.syncIcon}>
          <Ionicons
            name={email ? "cloud-done-outline" : "cloud-outline"}
            size={18}
            color={theme.ink}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.syncTitle}>Cloud sync</Text>
          <Text style={styles.syncSub}>{syncSub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.inkFaint} />
      </Pressable>

      <View style={styles.note}>
        <Ionicons name="lock-closed-outline" size={16} color={theme.inkMuted} />
        <Text style={styles.noteText}>
          Your data lives on this device. Sign in above to back it up and sync it across your
          devices — nothing else is ever uploaded.
        </Text>
      </View>

      <Text style={styles.section}>ABOUT</Text>
      <View style={styles.card}>
        <View style={[styles.dataRow, styles.divider]}>
          <Text style={styles.dataLabel}>Version</Text>
          <Text style={styles.dataValue}>1.0.0</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Made for</Text>
          <Text style={styles.dataValue}>small wins</Text>
        </View>
      </View>

      <Pressable style={styles.reset} onPress={confirmReset}>
        <Ionicons name="trash-outline" size={17} color={theme.ink} />
        <Text style={styles.resetText}>Reset all data</Text>
      </Pressable>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dataRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: theme.line },
  dataLabel: { color: theme.inkMuted, fontSize: 14 },
  dataValue: { color: theme.ink, fontSize: 14, fontWeight: "700" },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    marginBottom: 12,
  },
  syncIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  syncTitle: { color: theme.ink, fontSize: 16, fontWeight: "700" },
  syncSub: { color: theme.inkFaint, fontSize: 12, marginTop: 2 },
  note: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 14,
    marginBottom: 22,
  },
  noteText: { color: theme.inkMuted, fontSize: 13, lineHeight: 19, flex: 1 },
  reset: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: radius.lg,
    paddingVertical: 15,
    marginTop: 8,
  },
  resetText: { color: theme.ink, fontSize: 15, fontWeight: "700" },
});
