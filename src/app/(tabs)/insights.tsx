import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Card, Eyebrow } from "@/components/ui";
import { CountUp, Reveal, ProgressBar } from "@/components/anim";
import Heatmap from "@/components/heatmap";
import { useTheme, radius, fonts } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  scoreHistory,
  avgScore,
  streak,
} from "@/lib/store";
import { getPatterns, type PatternIcon } from "@/lib/patterns";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const PATTERN_ICON: Record<PatternIcon, keyof typeof Ionicons.glyphMap> = {
  sleep: "moon-outline",
  focus: "flash-outline",
  trend: "trending-up-outline",
  time: "time-outline",
  drink: "wine-outline",
  water: "water-outline",
};

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
  const patterns = getPatterns(logs);

  const stats = [
    { label: "7-day avg", raw: avg7, fmt: (n: number) => (avg7 ? String(Math.round(n)) : "—") },
    { label: "30-day avg", raw: avg30, fmt: (n: number) => (avg30 ? String(Math.round(n)) : "—") },
    { label: "Streak", raw: s, fmt: (n: number) => `${Math.round(n)}d` },
    { label: "Best score", raw: best, fmt: (n: number) => (best ? String(Math.round(n)) : "—") },
    { label: "Check-ins", raw: logs.length, fmt: (n: number) => String(Math.round(n)) },
    { label: "Total wins", raw: wins.length, fmt: (n: number) => String(Math.round(n)) },
    { label: "Deep work", raw: deepWork, fmt: (n: number) => `${Math.round(n)}h` },
    { label: "Workouts", raw: workouts.length, fmt: (n: number) => String(Math.round(n)) },
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
            <CountUp value={st.raw} format={st.fmt} style={[styles.statValue, { color: c.ink }]} />
            <Text style={[styles.statLabel, { color: c.inkFaint }]}>{st.label}</Text>
          </Card>
        ))}
      </View>

      {/* Smart patterns */}
      {patterns.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <View style={styles.patHead}>
            <Ionicons name="sparkles-outline" size={15} color={c.ink} />
            <Text style={[styles.patHeadText, { color: c.ink }]}>SMART PATTERNS</Text>
            <View style={[styles.patTag, { borderColor: c.line }]}>
              <Text style={[styles.patTagText, { color: c.inkMuted }]}>FROM YOUR DATA</Text>
            </View>
          </View>
          {patterns.map((p, i) => (
            <Reveal key={p.id} delay={i * 70} style={{ marginTop: 10 }}>
              <Card padding={16}>
                <View style={styles.patRow}>
                  <View
                    style={[
                      styles.patIcon,
                      { borderColor: p.positive ? c.chipBorder : c.line, backgroundColor: c.fill },
                    ]}
                  >
                    <Ionicons name={PATTERN_ICON[p.icon]} size={17} color={c.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.patTitleRow}>
                      <Text style={[styles.patTitle, { color: c.ink }]} numberOfLines={2}>
                        {p.title}
                      </Text>
                      <Text style={[styles.patSignal, { color: c.inkFaint }]}>{p.strength}%</Text>
                    </View>
                    <Text style={[styles.patDetail, { color: c.inkMuted }]}>{p.detail}</Text>
                    <ProgressBar
                      pct={p.strength}
                      color={c.ink}
                      track={c.fillStrong}
                      height={5}
                      rounded={3}
                      style={{ marginTop: 10 }}
                    />
                  </View>
                </View>
              </Card>
            </Reveal>
          ))}
        </View>
      )}

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
  patHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  patHeadText: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.2 },
  patTag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  patTagText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8 },
  patRow: { flexDirection: "row", gap: 12 },
  patIcon: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  patTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  patTitle: { fontFamily: fonts.displayBold, fontSize: 15, flex: 1, letterSpacing: -0.2 },
  patSignal: { fontFamily: fonts.mono, fontSize: 11 },
  patDetail: { fontFamily: fonts.body, fontSize: 13, marginTop: 3, lineHeight: 18 },
});
