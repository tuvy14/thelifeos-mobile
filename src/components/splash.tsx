import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

const OBSIDIAN = "#0a0a0b";
const INK = "#fafafa";
const MARK = require("../../assets/images/brandmark.png");
const MARK_ASPECT = 583 / 383;
const MARK_W = 150;

/** Branded loading screen. Notion-style: logo springs in from scale 0.72,
 *  wordmark fades below it, thin progress bar sweeps at the bottom.
 *  Self-contained — no theme/font deps so it renders before providers load. */
export default function Splash() {
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 13, bounciness: 4 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    Animated.timing(wordOpacity, { toValue: 1, duration: 260, delay: 260, easing: Easing.ease, useNativeDriver: true }).start();
    Animated.timing(bar, { toValue: 1, duration: 2200, delay: 60, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [bar, logoOpacity, logoScale, wordOpacity]);

  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Animated.View style={[styles.logoGlow, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Image
            source={MARK}
            tintColor={INK}
            contentFit="contain"
            style={{ width: MARK_W, height: MARK_W / MARK_ASPECT }}
          />
        </Animated.View>
        <Animated.Text style={[styles.wordmark, { opacity: wordOpacity }]}>
          TheLife<Text style={{ color: "rgba(250,250,250,0.4)" }}>OS</Text>
        </Animated.Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: barWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OBSIDIAN, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: 18 },
  logoGlow: { shadowColor: "#ffffff", shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  wordmark: { color: INK, fontSize: 21, fontWeight: "800", letterSpacing: -0.5 },
  track: { position: "absolute", bottom: 52, left: 52, right: 52, height: 1.5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" },
  fill: { height: 1.5, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 99 },
});
