import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { theme, radius } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  todayLog,
  streak,
  winsToday,
} from "@/lib/store";

export default function TodayScreen() {
  const { ready, logs, wins, addWin } = useStore();
  const [win, setWin] = useState("");

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.ink} />
      </View>
    );
  }

  const log = todayLog(logs);
  const score = scoreFor(log);
  const s = streak(logs);
  const todays = winsToday(wins);

  const label =
    score >= 80 ? "Crushing it" : score >= 55 ? "On track" : score >= 30 ? "Getting there" : "Start the day";
  const hero = !log
    ? "You haven't checked in yet today."
    : s >= 3
      ? `${s} days strong — keep it alive.`
      : "Logged today. See you tomorrow.";

  const metrics = [
    { icon: "moon-outline", label: "Sleep", value: log ? `${round(log.sleep)}h` : "—" },
    { icon: "water-outline", label: "Water", value: log ? `${round(log.water)}L` : "—" },
    { icon: "flash-outline", label: "Deep work", value: log ? `${round(log.deepWork)}h` : "—" },
    { icon: "happy-outline", label: "Mood", value: log ? `${log.mood}/10` : "—" },
  ] as const;

  const shortcuts: { href: Href; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { href: "/habits", icon: "repeat-outline", label: "Habits" },
    { href: "/journal", icon: "book-outline", label: "Journal" },
    { href: "/goals", icon: "flag-outline", label: "Goals" },
    { href: "/insights", icon: "stats-chart-outline", label: "Insights" },
  ];

  return (
    <Screen>
      <Text style={styles.eyebrow}>LIFE SCORE · TODAY</Text>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.scoreMax}>/ 100</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.heroMsg}>{hero}</Text>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🔥 {s}-day streak</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>✦ {todays.length} wins today</Text>
          </View>
        </View>

        {!log && (
          <Pressable
            style={styles.cta}
            onPress={() => router.navigate("/check-in")}
          >
            <Text style={styles.ctaText}>Check in</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.obsidian} />
          </Pressable>
        )}
      </View>

      {/* Metrics */}
      <View style={styles.metricGrid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Ionicons name={m.icon as any} size={16} color={theme.inkMuted} />
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Shortcuts */}
      <View style={styles.shortcutRow}>
        {shortcuts.map((sc) => (
          <Pressable
            key={sc.label}
            style={styles.shortcut}
            onPress={() => router.navigate(sc.href)}
          >
            <Ionicons name={sc.icon} size={18} color={theme.ink} />
            <Text style={styles.shortcutLabel}>{sc.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Quick win */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Small wins</Text>
        <Text style={styles.cardSub}>The day is built from these.</Text>
        <View style={styles.winRow}>
          <TextInput
            value={win}
            onChangeText={setWin}
            placeholder="What went well?"
            placeholderTextColor={theme.inkFaint}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={() => {
              addWin(win);
              setWin("");
            }}
          />
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              addWin(win);
              setWin("");
            }}
          >
            <Ionicons name="add" size={22} color={theme.obsidian} />
          </Pressable>
        </View>
        {todays.slice(0, 3).map((w) => (
          <View key={w.id} style={styles.winItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.ink} />
            <Text style={styles.winText}>{w.text}</Text>
          </View>
        ))}
        {todays.length > 0 && (
          <Pressable onPress={() => router.navigate("/wins")}>
            <Text style={styles.viewAll}>View all →</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.obsidian },
  eyebrow: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  hero: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 24,
    alignItems: "center",
  },
  score: { color: theme.ink, fontSize: 72, fontWeight: "800", letterSpacing: -2, lineHeight: 76 },
  scoreMax: { color: theme.inkFaint, fontSize: 13, marginTop: -4 },
  label: { color: theme.ink, fontSize: 26, fontWeight: "800", marginTop: 10, letterSpacing: -0.5 },
  heroMsg: { color: theme.inkMuted, fontSize: 14, marginTop: 4, textAlign: "center" },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { color: theme.ink, fontSize: 12, fontWeight: "600" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 18,
  },
  ctaText: { color: theme.obsidian, fontWeight: "700", fontSize: 14 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  metricCard: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  metricValue: { color: theme.ink, fontSize: 24, fontWeight: "800", marginTop: 8 },
  metricLabel: { color: theme.inkFaint, fontSize: 12, marginTop: 2 },
  shortcutRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  shortcut: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    paddingVertical: 14,
  },
  shortcutLabel: { color: theme.inkMuted, fontSize: 11, fontWeight: "600" },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 20,
    marginTop: 16,
  },
  cardTitle: { color: theme.ink, fontSize: 17, fontWeight: "700" },
  cardSub: { color: theme.inkMuted, fontSize: 12, marginTop: 2, marginBottom: 14 },
  winRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    fontSize: 14,
  },
  addBtn: {
    width: 46,
    backgroundColor: theme.ink,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  winItem: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  winText: { color: theme.ink, fontSize: 14, flex: 1 },
  viewAll: { color: theme.inkMuted, fontSize: 13, marginTop: 14 },
});
