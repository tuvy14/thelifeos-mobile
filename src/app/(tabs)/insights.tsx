import { View, Text, StyleSheet } from "react-native";

import { Screen } from "@/components/screen";
import { theme, radius } from "@/lib/theme";
import {
  useStore,
  scoreTrend,
  avgScore,
  streak,
  winsToday,
  habitDoneToday,
  balance,
} from "@/lib/store";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function InsightsScreen() {
  const { logs, wins, habits, money } = useStore();

  const trend = scoreTrend(logs, 7);
  const avg = avgScore(logs, 7);
  const s = streak(logs);
  const peak = Math.max(1, ...trend.map((t) => t.score));
  const habitsToday = habits.filter(habitDoneToday).length;
  const bal = balance(money);

  const stats = [
    { label: "7-day avg score", value: avg ? String(avg) : "—" },
    { label: "Current streak", value: `${s}d` },
    { label: "Wins today", value: String(winsToday(wins).length) },
    { label: "Total wins", value: String(wins.length) },
    {
      label: "Habits done today",
      value: habits.length ? `${habitsToday}/${habits.length}` : "—",
    },
    { label: "Net balance", value: money.length ? fmtMoney(bal) : "—" },
  ];

  return (
    <Screen>
      <Text style={styles.eyebrow}>THE BIG PICTURE</Text>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.sub}>Patterns beat willpower. Here&apos;s your week.</Text>

      {/* Trend chart */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Life score · last 7 days</Text>
          <Text style={styles.cardAvg}>avg {avg || 0}</Text>
        </View>
        <View style={styles.chart}>
          {trend.map((t, i) => {
            const h = 8 + (t.score / peak) * 96;
            const d = new Date(t.date + "T00:00:00").getDay();
            const isToday = i === trend.length - 1;
            return (
              <View key={t.date} style={styles.barCol}>
                <Text style={styles.barVal}>{t.score || ""}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: h },
                      isToday ? styles.barToday : null,
                      t.score === 0 ? styles.barEmpty : null,
                    ]}
                  />
                </View>
                <Text style={[styles.barDay, isToday && styles.barDayToday]}>{DOW[d]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stat grid */}
      <View style={styles.grid}>
        {stats.map((st) => (
          <View key={st.label} style={styles.statCard}>
            <Text style={styles.statValue}>{st.value}</Text>
            <Text style={styles.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {logs.length === 0 && (
        <Text style={styles.hint}>
          Check in a few days in a row and your trends will show up here.
        </Text>
      )}
    </Screen>
  );
}

function fmtMoney(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

const styles = StyleSheet.create({
  eyebrow: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: theme.ink, fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  sub: { color: theme.inkMuted, fontSize: 14, marginTop: 2, marginBottom: 18 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 18,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { color: theme.ink, fontSize: 14, fontWeight: "700" },
  cardAvg: { color: theme.inkFaint, fontSize: 12, fontWeight: "600" },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 150 },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barVal: { color: theme.inkFaint, fontSize: 10, fontWeight: "700", height: 12 },
  barTrack: { height: 104, justifyContent: "flex-end" },
  bar: { width: 18, borderRadius: 6, backgroundColor: theme.inkMuted },
  barToday: { backgroundColor: theme.ink },
  barEmpty: { backgroundColor: theme.line },
  barDay: { color: theme.inkFaint, fontSize: 11, fontWeight: "600" },
  barDayToday: { color: theme.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  statCard: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  statValue: { color: theme.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { color: theme.inkFaint, fontSize: 12, marginTop: 4 },
  hint: { color: theme.inkFaint, fontSize: 13, marginTop: 18, textAlign: "center", lineHeight: 19 },
});
