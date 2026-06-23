import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, IconBadge } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";

const METRICS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "eye-outline", label: "Avg views" },
  { icon: "heart-outline", label: "Avg likes" },
  { icon: "pulse-outline", label: "Engagement" },
  { icon: "chatbubble-outline", label: "Avg comments" },
  { icon: "share-social-outline", label: "Avg shares" },
  { icon: "videocam-outline", label: "Videos" },
];

export default function TikTokScreen() {
  const { c } = useTheme();
  const s = makeStyles(c);
  return (
    <SubScreen eyebrow="Creator" title="TikTok analytics">
      <Text style={s.sub}>Average views, likes and engagement — pulled from your account.</Text>

      <Card style={{ marginTop: 16, alignItems: "center", gap: 14 }} padding={28}>
        <View style={[s.bigIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name="logo-tiktok" size={26} color={c.ink} />
        </View>
        <Text style={s.connectTitle}>Connect your TikTok</Text>
        <Text style={s.connectText}>
          Creator analytics use TikTok&apos;s official Login Kit. Connect once from the TheLifeOS web
          dashboard and your latest videos sync here automatically — same account.
        </Text>
        <View style={[s.webPill, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name="globe-outline" size={14} color={c.inkMuted} />
          <Text style={s.webPillText}>thelifeos.org → Dashboard → TikTok</Text>
        </View>
      </Card>

      <Text style={s.preview}>WHAT YOU&apos;LL SEE</Text>
      <View style={s.grid}>
        {METRICS.map((m) => (
          <Card key={m.label} style={s.metricCard} padding={16}>
            <IconBadge name={m.icon} />
            <Text style={s.metricValue}>—</Text>
            <Text style={s.metricLabel}>{m.label}</Text>
          </Card>
        ))}
      </View>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    bigIcon: { width: 56, height: 56, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    connectTitle: { fontFamily: fonts.displayBold, fontSize: 19, color: c.ink },
    connectText: { fontFamily: fonts.body, fontSize: 13.5, color: c.inkMuted, lineHeight: 20, textAlign: "center" },
    webPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
    webPillText: { fontFamily: fonts.mono, fontSize: 11, color: c.inkMuted },
    preview: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: c.inkFaint, marginTop: 24, marginBottom: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    metricCard: { flexGrow: 1, flexBasis: "30%" },
    metricValue: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink, marginTop: 10 },
    metricLabel: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint, marginTop: 2 },
  });
