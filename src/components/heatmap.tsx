import { View, Text, ScrollView, StyleSheet } from "react-native";

import { useTheme, radius, fonts } from "@/lib/theme";
import { useStore, scoreHistory } from "@/lib/store";

/** Check-in score heatmap (GitHub-style) — mirrors the web Heatmap. */
export default function Heatmap({ weeks = 16 }: { weeks?: number }) {
  const { c, isDark } = useTheme();
  const { logs } = useStore();
  const days = scoreHistory(logs, weeks * 7); // oldest → newest

  const tierColors = isDark
    ? ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.20)", "rgba(255,255,255,0.45)", c.ink]
    : ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.40)", c.ink];
  const tier = (score: number) =>
    score <= 0 ? tierColors[0] : score < 40 ? tierColors[1] : score < 70 ? tierColors[2] : tierColors[3];

  const lead = new Date(days[0].date + "T00:00:00").getDay();
  const cells: ({ date: string; score: number } | null)[] = [...Array(lead).fill(null), ...days];
  const columns: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));

  const logged = days.filter((d) => d.score > 0).length;

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.ink }]}>Check-in heatmap</Text>
        <Text style={[styles.count, { color: c.inkFaint }]}>{logged} days logged</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {columns.map((col, ci) => (
            <View key={ci} style={{ gap: 4 }}>
              {Array.from({ length: 7 }).map((_, ri) => {
                const cell = col[ri];
                return (
                  <View
                    key={ri}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: cell ? tier(cell.score) : "transparent",
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: c.inkFaint }]}>Less</Text>
        {tierColors.map((t, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t }} />
        ))}
        <Text style={[styles.legendText, { color: c.inkFaint }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 18 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  count: { fontFamily: fonts.mono, fontSize: 11 },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12 },
  legendText: { fontFamily: fonts.body, fontSize: 10 },
});
