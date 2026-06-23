import { useMemo, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, FOCUS_AREAS } from "@/lib/store";

interface Cmd { id: string; label: string; group: string; icon: keyof typeof Ionicons.glyphMap; run: () => void }

const ROUTES: { href: Href; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: "/", label: "Today", icon: "today-outline" },
  { href: "/check-in", label: "Check-in", icon: "checkmark-circle-outline" },
  { href: "/wins", label: "Wins", icon: "sparkles-outline" },
  { href: "/insights", label: "Insights", icon: "stats-chart-outline" },
  { href: "/habits", label: "Habits", icon: "repeat-outline" },
  { href: "/goals", label: "Goals", icon: "flag-outline" },
  { href: "/journal", label: "Journal", icon: "book-outline" },
  { href: "/fitness", label: "Fitness", icon: "barbell-outline" },
  { href: "/focus", label: "Focus", icon: "timer-outline" },
  { href: "/money", label: "Money", icon: "cash-outline" },
  { href: "/calendar", label: "Calendar", icon: "calendar-outline" },
  { href: "/leaderboard", label: "Leaderboard", icon: "trophy-outline" },
  { href: "/achievements", label: "Achievements", icon: "ribbon-outline" },
  { href: "/memories", label: "Memories", icon: "time-outline" },
  { href: "/tiktok", label: "TikTok", icon: "videocam-outline" },
  { href: "/referrals", label: "Refer & earn", icon: "gift-outline" },
  { href: "/account", label: "Cloud sync", icon: "cloud-outline" },
  { href: "/settings", label: "Settings", icon: "settings-outline" },
];

export default function CommandPalette({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c, isDark, toggle } = useTheme();
  const { setActiveMode } = useStore();
  const s = makeStyles(c);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const close = () => { setQuery(""); onClose(); };
  const go = (href: Href) => { close(); router.navigate(href); };

  const commands = useMemo<Cmd[]>(() => [
    { id: "checkin", label: "Start daily check-in", group: "Actions", icon: "checkmark-circle-outline", run: () => go("/check-in") },
    { id: "win", label: "Log a small win", group: "Actions", icon: "sparkles-outline", run: () => go("/wins") },
    { id: "theme", label: `Switch to ${isDark ? "light" : "dark"} theme`, group: "Actions", icon: isDark ? "sunny-outline" : "moon-outline", run: () => { close(); toggle(); } },
    ...ROUTES.map((r) => ({ id: `v-${r.label}`, label: r.label, group: "Go to", icon: r.icon, run: () => go(r.href) })),
    ...FOCUS_AREAS.map((f) => ({ id: `m-${f.id}`, label: `Focus: ${f.label}`, group: "Focus mode", icon: "locate-outline" as const, run: () => { close(); setActiveMode(f.id); router.navigate("/check-in"); } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isDark]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.group.toLowerCase().includes(q));
  }, [commands, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close} />
      <View style={[s.wrap, { paddingTop: insets.top + 60 }]} pointerEvents="box-none">
        <View style={[s.panel, { backgroundColor: c.surface, borderColor: c.line }]}>
          <View style={[s.searchRow, { borderBottomColor: c.line }]}>
            <Ionicons name="search" size={17} color={c.inkFaint} />
            <TextInput
              autoFocus value={query} onChangeText={setQuery}
              placeholder="Search actions, pages, focus modes…" placeholderTextColor={c.inkFaint}
              style={s.search}
            />
          </View>
          <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 8 }}>
            {filtered.length === 0 ? (
              <Text style={s.empty}>No results for “{query}”.</Text>
            ) : (
              filtered.map((cmd) => (
                <Pressable key={cmd.id} style={s.cmd} onPress={cmd.run}>
                  <View style={[s.cmdIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
                    <Ionicons name={cmd.icon} size={15} color={c.ink} />
                  </View>
                  <Text style={s.cmdLabel}>{cmd.label}</Text>
                  <Text style={s.cmdGroup}>{cmd.group.toUpperCase()}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
    wrap: { flex: 1, alignItems: "center", paddingHorizontal: 16 },
    panel: { width: "100%", maxWidth: 520, borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
    searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderBottomWidth: 1 },
    search: { flex: 1, paddingVertical: 14, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    empty: { textAlign: "center", paddingVertical: 32, fontFamily: fonts.body, fontSize: 14, color: c.inkMuted },
    cmd: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 10 },
    cmdIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    cmdLabel: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: c.ink },
    cmdGroup: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: c.inkFaint },
  });
