import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Eyebrow } from "@/components/ui";
import { PressableScale, Reveal } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, FOCUS_AREAS, activeMode } from "@/lib/store";
import { useSync } from "@/lib/sync";

type Tile = { href: Href; icon: keyof typeof Ionicons.glyphMap; label: string };
type Group = { label: string | null; items: Tile[] };

const GROUPS: Group[] = [
  { label: null, items: [
    { href: "/", icon: "today-outline", label: "Today" },
    { href: "/check-in", icon: "checkmark-circle-outline", label: "Check-in" },
    { href: "/calendar", icon: "calendar-outline", label: "Calendar" },
  ] },
  { label: "Track", items: [
    { href: "/habits", icon: "repeat-outline", label: "Habits" },
    { href: "/goals", icon: "flag-outline", label: "Goals" },
    { href: "/wins", icon: "sparkles-outline", label: "Wins" },
    { href: "/journal", icon: "book-outline", label: "Journal" },
  ] },
  { label: "Log", items: [
    { href: "/fitness", icon: "barbell-outline", label: "Fitness" },
    { href: "/focus", icon: "timer-outline", label: "Focus" },
    { href: "/money", icon: "cash-outline", label: "Money" },
  ] },
  { label: "Insights", items: [
    { href: "/insights", icon: "stats-chart-outline", label: "Insights" },
    { href: "/leaderboard", icon: "trophy-outline", label: "Leaderboard" },
    { href: "/achievements", icon: "ribbon-outline", label: "Achievements" },
    { href: "/memories", icon: "time-outline", label: "Memories" },
    { href: "/tiktok", icon: "videocam-outline", label: "TikTok" },
  ] },
];

const FOCUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  fitness: "barbell-outline", focus: "timer-outline", business: "trending-up-outline",
  creator: "videocam-outline", money: "cash-outline", mind: "leaf-outline",
  habits: "repeat-outline", learn: "book-outline",
};

export default function MoreScreen() {
  const { mode, profile, setActiveMode } = useStore();
  const { email } = useSync();
  const { c } = useTheme();
  const s = makeStyles(c);
  const current = activeMode(mode, profile);

  const Tile = ({ it, delay = 0 }: { it: Tile; delay?: number }) => (
    <Reveal delay={delay} style={s.tileWrap}>
      <PressableScale style={s.tile} onPress={() => router.navigate(it.href)}>
        <View style={[s.tileIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
          <Ionicons name={it.icon} size={17} color={c.ink} />
        </View>
        <Text style={s.tileLabel}>{it.label}</Text>
      </PressableScale>
    </Reveal>
  );

  const pickMode = (id: string) => { setActiveMode(id); router.navigate("/check-in"); };

  return (
    <Screen>
      <Eyebrow>Everything</Eyebrow>
      <Text style={[styles.title, { color: c.ink }]}>All your tools</Text>

      {GROUPS.map((g) => (
        <View key={g.label ?? "main"} style={{ marginTop: g.label ? 22 : 18 }}>
          {g.label && <Text style={s.groupLabel}>{g.label.toUpperCase()}</Text>}
          <View style={s.grid}>
            {g.items.map((it, idx) => <Tile key={it.label} it={it} delay={idx * 55} />)}
          </View>
        </View>
      ))}

      {/* Account + settings */}
      <View style={{ marginTop: 22, gap: 10 }}>
        {!profile?.admin && (
          <PressableScale style={[s.wideRow, { borderColor: c.ink }]} onPress={() => router.navigate("/upgrade")}>
            <View style={[s.tileIcon, { borderColor: c.ink, backgroundColor: c.ink }]}><Ionicons name="sparkles" size={17} color={c.obsidian} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.wideTitle}>Upgrade to Pro</Text>
              <Text style={s.wideSub}>Lifetime $200 · or $15/mo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
          </PressableScale>
        )}
        <PressableScale style={s.wideRow} onPress={() => router.navigate("/referrals")}>
          <View style={[s.tileIcon, { borderColor: c.line, backgroundColor: c.fill }]}><Ionicons name="gift-outline" size={17} color={c.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.wideTitle}>Refer & earn</Text>
            <Text style={s.wideSub}>Invite friends, earn 25%</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
        </PressableScale>
        <PressableScale style={s.wideRow} onPress={() => router.navigate("/account")}>
          <View style={[s.tileIcon, { borderColor: c.line, backgroundColor: c.fill }]}><Ionicons name={email ? "cloud-done-outline" : "cloud-outline"} size={17} color={c.ink} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.wideTitle}>Cloud sync</Text>
            <Text style={s.wideSub}>{email ? `Synced · ${email}` : "Sign in to sync devices"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
        </PressableScale>
        <PressableScale style={s.wideRow} onPress={() => router.navigate("/settings")}>
          <View style={[s.tileIcon, { borderColor: c.line, backgroundColor: c.fill }]}><Ionicons name="settings-outline" size={17} color={c.ink} /></View>
          <Text style={[s.wideTitle, { flex: 1 }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
        </PressableScale>
      </View>

      {/* Focus mode */}
      <View style={{ marginTop: 22 }}>
        <Text style={s.groupLabel}>FOCUS MODE</Text>
        <View style={s.grid}>
          {FOCUS_AREAS.map((f, idx) => {
            const on = current === f.id;
            return (
              <Reveal key={f.id} delay={idx * 45} style={s.tileWrap}>
                <PressableScale style={[s.tile, on && { borderColor: c.ink }]} onPress={() => pickMode(f.id)}>
                  <View style={[s.tileIcon, { borderColor: c.line, backgroundColor: on ? c.ink : c.fill }]}>
                    <Ionicons name={FOCUS_ICON[f.id] ?? "ellipse-outline"} size={17} color={on ? c.obsidian : c.ink} />
                  </View>
                  <Text style={s.tileLabel} numberOfLines={1}>{f.label}</Text>
                </PressableScale>
              </Reveal>
            );
          })}
        </View>
      </View>

      <Text style={[styles.footer, { color: c.inkFaint }]}>TheLifeOS · v1.0</Text>
    </Screen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    groupLabel: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: c.inkFaint, marginBottom: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    tileWrap: { flexGrow: 1, flexBasis: "46%" },
    tile: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: 14 },
    tileIcon: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    tileLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink, flexShrink: 1 },
    wideRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: 14 },
    wideTitle: { fontFamily: fonts.bodySemibold, fontSize: 15, color: c.ink },
    wideSub: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint, marginTop: 2 },
  });

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayBold, fontSize: 28, letterSpacing: -0.5, marginTop: 8 },
  footer: { fontFamily: fonts.body, fontSize: 12, textAlign: "center", marginTop: 28 },
});
