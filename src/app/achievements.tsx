import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { Reveal, ProgressBar } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, getAchievements } from "@/lib/store";

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  flag: "flag", flame: "flame", sparkles: "sparkles", flash: "flash",
  barbell: "barbell", book: "book", star: "star",
};

export default function AchievementsScreen() {
  const { logs, wins, workouts, journal, goals } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const items = getAchievements({ logs, wins, workouts, journal, goals });
  const unlocked = items.filter((a) => a.unlocked).length;

  return (
    <SubScreen eyebrow="Milestones" title="Achievements">
      <Text style={s.sub}>{unlocked}/{items.length} unlocked — keep stacking small wins.</Text>

      <View style={s.grid}>
        {items.map((a, idx) => {
          const pct = Math.min(100, Math.round((a.current / a.goal) * 100));
          return (
            <Reveal key={a.id} delay={idx * 45} style={s.card}>
            <Card style={!a.unlocked && { opacity: 0.78 }} padding={16}>
              <View style={[s.badge, { borderColor: c.line, backgroundColor: a.unlocked ? c.ink : c.fill }]}>
                <Ionicons name={ICON[a.icon] ?? "star"} size={20} color={a.unlocked ? c.obsidian : c.inkMuted} />
              </View>
              <Text style={s.title}>{a.label}</Text>
              <Text style={s.desc}>{a.description}</Text>
              {a.unlocked ? (
                <View style={[s.pill, { backgroundColor: c.ink }]}>
                  <Text style={[s.pillText, { color: c.obsidian }]}>UNLOCKED</Text>
                </View>
              ) : (
                <>
                  <ProgressBar pct={pct} color={c.ink} track={c.fillStrong} height={6} rounded={3} style={{ marginTop: 10 }} />
                  <Text style={s.progress}>{Math.min(a.current, a.goal)}/{a.goal}</Text>
                </>
              )}
            </Card>
            </Reveal>
          );
        })}
      </View>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
    card: { flexGrow: 1, flexBasis: "46%" },
    badge: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    title: { fontFamily: fonts.display, fontSize: 15, color: c.ink },
    desc: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted, marginTop: 3, lineHeight: 16, minHeight: 32 },
    pill: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, marginTop: 8 },
    pillText: { fontFamily: fonts.monoSemibold, fontSize: 9, letterSpacing: 1 },
    track: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 10 },
    fill: { height: 6, borderRadius: 3 },
    progress: { fontFamily: fonts.mono, fontSize: 11, color: c.inkFaint, marginTop: 6 },
  });
