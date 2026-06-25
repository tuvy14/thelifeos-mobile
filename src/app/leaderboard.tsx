import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { Reveal } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, xpFor, levelFor, streak } from "@/lib/store";

const TEASERS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "people-outline", title: "Compete with everyone", body: "See where your momentum ranks against the whole community." },
  { icon: "flame-outline", title: "Streak leagues", body: "Climb weekly leagues by showing up — longest streaks rise." },
  { icon: "trending-up-outline", title: "Momentum, ranked", body: "Your XP, score and consistency roll into one live ranking." },
];

export default function LeaderboardScreen() {
  const { logs, wins } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);

  const info = levelFor(xpFor(logs, wins));
  const stk = streak(logs);

  return (
    <SubScreen eyebrow="Leaderboard" title="Where you stand">
      <Text style={s.sub}>Momentum, ranked. Show up daily to climb.</Text>

      {/* Coming soon */}
      <Reveal delay={40} style={{ marginTop: 16 }}>
        <Card padding={22} rounded={radius.xl} style={{ alignItems: "center" }}>
          <View style={[s.lock, { borderColor: c.line, backgroundColor: c.fill }]}>
            <Ionicons name="lock-closed-outline" size={24} color={c.ink} />
          </View>
          <View style={[s.pill, { borderColor: c.line, backgroundColor: c.fill }]}>
            <View style={[s.dot, { backgroundColor: c.ink }]} />
            <Text style={[s.pillText, { color: c.inkMuted }]}>COMING SOON</Text>
          </View>
          <Text style={s.h3}>The leaderboard is being built.</Text>
          <Text style={s.body}>
            We&apos;re wiring up real, fair rankings across the whole TheLifeOS community. Keep
            checking in — every check-in already counts toward your level and carries over when it
            goes live.
          </Text>

          {/* Live momentum teaser */}
          <View style={[s.statRow, { borderColor: c.line }]}>
            <View style={s.stat}>
              <View style={s.statTop}>
                <Ionicons name="flash" size={15} color={c.inkMuted} />
                <Text style={s.statValue}>{info.level}</Text>
              </View>
              <Text style={s.statLabel}>LEVEL</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: c.line }]} />
            <View style={s.stat}>
              <Text style={s.statValue}>{info.xp.toLocaleString()}</Text>
              <Text style={s.statLabel}>TOTAL XP</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: c.line }]} />
            <View style={s.stat}>
              <View style={s.statTop}>
                <Ionicons name="flame" size={15} color={c.inkMuted} />
                <Text style={s.statValue}>{stk}</Text>
              </View>
              <Text style={s.statLabel}>STREAK</Text>
            </View>
          </View>
          <Text style={s.foot}>
            {info.isMax ? `${info.name} — max level` : `${info.name} · ${info.toNext} XP to level ${info.level + 1}`}
          </Text>
        </Card>
      </Reveal>

      {/* What's coming */}
      <View style={{ marginTop: 14, gap: 12 }}>
        {TEASERS.map((t, i) => (
          <Reveal key={t.title} delay={120 + i * 60}>
            <Card>
              <View style={[s.teaserIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
                <Ionicons name={t.icon} size={16} color={c.ink} />
              </View>
              <Text style={s.teaserTitle}>{t.title}</Text>
              <Text style={s.teaserBody}>{t.body}</Text>
            </Card>
          </Reveal>
        ))}
      </View>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    lock: { width: 60, height: 60, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    pill: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5, marginTop: 16 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4 },
    h3: { fontFamily: fonts.displayBold, fontSize: 21, color: c.ink, letterSpacing: -0.4, textAlign: "center", marginTop: 14 },
    body: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, textAlign: "center", lineHeight: 19, marginTop: 8 },
    statRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.lg, marginTop: 20, paddingVertical: 14, width: "100%" },
    stat: { flex: 1, alignItems: "center", gap: 3 },
    statTop: { flexDirection: "row", alignItems: "center", gap: 4 },
    statValue: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink, letterSpacing: -0.5 },
    statLabel: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: c.inkFaint },
    statDivider: { width: 1, height: 36 },
    foot: { fontFamily: fonts.mono, fontSize: 11, color: c.inkFaint, marginTop: 12, textAlign: "center" },
    teaserIcon: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    teaserTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: c.ink, marginTop: 14 },
    teaserBody: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, lineHeight: 19, marginTop: 6 },
  });
