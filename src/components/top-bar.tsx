import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, fonts, radius } from "@/lib/theme";
import { PressableScale } from "@/components/anim";
import CommandPalette from "@/components/command-palette";
import Logo from "@/components/logo";

/** Shared top bar for the tab screens: wordmark + search (command palette) + theme toggle. */
export default function TopBar() {
  const { c, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <BlurView
      intensity={isDark ? 30 : 50}
      tint={isDark ? "dark" : "light"}
      style={[styles.bar, { paddingTop: insets.top + 8, borderBottomColor: c.line }]}
    >
      <View style={styles.brand}>
        <Logo height={22} glow={false} />
        <Text style={[styles.wordmark, { color: c.ink }]}>
          TheLife<Text style={{ color: c.inkMuted }}>OS</Text>
        </Text>
      </View>
      <View style={styles.actions}>
        <PressableScale
          onPress={() => setPaletteOpen(true)}
          style={[styles.iconBtn, { borderColor: c.line }]}
          hitSlop={6}
          scaleTo={0.9}
        >
          <Ionicons name="search" size={16} color={c.inkMuted} />
        </PressableScale>
        <PressableScale
          onPress={toggle}
          style={[styles.iconBtn, { borderColor: c.line }]}
          hitSlop={6}
          scaleTo={0.9}
        >
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={16} color={c.inkMuted} />
        </PressableScale>
      </View>
      <CommandPalette visible={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 17, letterSpacing: -0.3 },
  actions: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
