import { useEffect, useRef } from "react";
import { Animated, View, Text, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme, fonts, radius } from "@/lib/theme";
import { PressableScale } from "@/components/anim";
import Logo from "@/components/logo";
import XpBar from "@/components/xp-bar";

/** Shared top bar for the tab screens. The brand is a tappable "home" button with
 *  a soft breathing glow; the only action is the light/dark toggle. */
export default function TopBar() {
  const { c, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();

  // Gentle breathing glow behind the mark so the brand feels alive.
  const glow = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.85, duration: 2200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.35, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const goHome = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* ignore */ }
    router.navigate("/");
  };

  return (
    <BlurView
      intensity={isDark ? 30 : 50}
      tint={isDark ? "dark" : "light"}
      style={[styles.bar, { paddingTop: insets.top + 8, borderBottomColor: c.line }]}
    >
      <PressableScale onPress={goHome} scaleTo={0.94} style={styles.brand} hitSlop={8}>
        <View style={styles.logoWrap}>
          {isDark && (
            <Animated.View
              pointerEvents="none"
              style={[styles.logoGlow, { opacity: glow }]}
            />
          )}
          <Logo height={24} glow={false} />
        </View>
        <Text style={[styles.wordmark, { color: c.ink }]}>
          TheLife<Text style={{ color: c.inkMuted }}>OS</Text>
        </Text>
      </PressableScale>
      <View style={styles.right}>
        <XpBar variant="compact" onPress={() => router.navigate("/achievements")} />
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.iconBtn, { borderColor: c.line, opacity: pressed ? 0.55 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={16} color={c.inkMuted} />
        </Pressable>
      </View>
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
  brand: { flexDirection: "row", alignItems: "center", gap: 9, flexShrink: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoWrap: { alignItems: "center", justifyContent: "center" },
  logoGlow: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#ffffff",
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: -0.3 },
  iconBtn: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
