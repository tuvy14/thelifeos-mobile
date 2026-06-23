import { View, Text, StyleSheet } from "react-native";

import { Screen } from "@/components/screen";
import { Card, Eyebrow } from "@/components/ui";
import Heatmap from "@/components/heatmap";
import { useTheme, radius, fonts } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  scoreHistory,
  avgScore,
  streak,
} from "@/lib/store";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function InsightsScreen() {
  const { logs, wins, workouts } = useStore();
  const { c } = useTheme();

  const trend = scoreHistory(logs, 14);
  const last7 = trend.slice(-7);
  const avg7 = avgScore(logs, 7);
  const avg30 = avgScore(logs, 30);
  const s = streak(logs);
  const best = Math.max(0, ...logs.map((l) => scoreFor(l)));
  const peak = Math.max(1, ...trend.map((t) => t.score));
  const deepWork = Math.round(logs.reduce((a, l) => a + (l.deepWork || 0), 0));

  const stats = [
    { label: "7-day avg", value: avg7 ? String(avg7) : "—" },
    { label: "30-day avg", value: avg30 ? String(avg30) : "—" },
    { label: "Streak", value: `${s}d` },
    { label: "Best score", value: best ? String(best) : "—" },
    { label: "Check-ins", value: String(logs.length) },
    { label: "Total wins", value: String(wins.length) },
    { label: "Deep work", value: `${deepWork}h` },
    { label: "Workouts", value: String(workouts.length) },
  ];

  return (
    <Screen>
      <Eyebrow>Patterns</Eyebrow>
      <Text style={[styles.title, { color: c.ink }]}>Insights</Text>
      <Text style={[styles.sub, { color: c.inkMuted }]}>Patterns beat willpower. Here&apos;s the trend.</Text>

      {/* Trend */}
      <Card style={{ marginTop: 18 }}>
        <View style={styles.head}>
          <Text style={[styles.cardTitle, { color: c.ink }]}>Life score · last 14 days</Text>
          <Text style={[styles.avg, { color: c.inkFaint }]}>avg {avg7 || 0}</Text>
        </View>
        <View style={styles.chart}>
          {trend.map((t, i) => {
            const d = new Date(t.date + "T00:00:00").getDay();
            const isToday = i === trend.length - 1;
            return (
              <View key={t.date} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={{
                      width: "62%",
                      height: `${Math.max(2, (t.score / peak) * 100)}%`,
                      borderRadius: 3,
                      backgroundColor: t.score === 0 ? c.fillStrong : isToday ? c.ink : c.inkMuted,
                    }}
                  />
                </View>
                <Text style={[styles.barDay, { color: isToday ? c.ink : c.inkFaint }]}>{DOW[d]}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Heatmap */}
      <View style={{ marginTop: 14 }}>
        <Heatmap weeks={16} />
      </View>

      {/* Stat grid */}
      <View style={styles.grid}>
        {stats.map((st) => (
          <Card key={st.label} style={styles.statCard} padding={16}>
            <Text style={[styles.statValue, { color: c.ink }]}>{st.value}</Text>
            <Text style={[styles.statLabel, { color: c.inkFaint }]}>{st.label}</Text>
          </Card>
        ))}
      </View>

      {logs.length === 0 && (
        <Text style={[styles.hint, { color: c.inkFaint }]}>
          Check in a few days running and your trends will fill in here.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayBold, fontSize: 28, letterSpacing: -0.5, marginTop: 8 },
  sub: { fontFamily: fonts.body, fontSize: 13, marginTop: 3 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  avg: { fontFamily: fonts.mono, fontSize: 12 },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 130 },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: { height: 104, width: "100%", alignItems: "center", justifyContent: "flex-end" },
  barDay: { fontFamily: fonts.mono, fontSize: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  statCard: { flexGrow: 1, flexBasis: "46%" },
  statValue: { fontFamily: fonts.displayBold, fontSize: 24, letterSpacing: -0.5 },
  statLabel: { fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  hint: { fontFamily: fonts.body, fontSize: 13, textAlign: "center", marginTop: 18, lineHeight: 19 },
});
