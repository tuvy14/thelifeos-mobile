import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, fonts, radius, type Palette } from "@/lib/theme";
import { useStore, xpFor, levelFor, type LevelInfo } from "@/lib/store";
import { PressableScale, ProgressBar } from "@/components/anim";
import { cheer } from "@/lib/feedback";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Respects the OS "Reduce Motion" setting (no extra deps). */
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let on = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => on && setReduce(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v) =>
      setReduce(!!v)
    );
    return () => {
      on = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

/** Glow ring whose arc tracks progress through the current level; the level
 *  number sits at its centre. Mirrors the web ScoreRing language. */
function GlowRing({
  pct,
  level,
  size,
  stroke,
  c,
  scale,
  shock,
}: {
  pct: number;
  level: number;
  size: number;
  stroke: number;
  c: Palette;
  scale: Animated.AnimatedInterpolation<number>;
  shock?: Animated.Value;
}) {
  const r = (size - stroke) / 2 - 1;
  const circ = 2 * Math.PI * r;
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const clamped = Math.max(0, Math.min(100, pct)) / 100;
    const anim = Animated.timing(progress, {
      toValue: clamped,
      duration: 900,
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [pct, progress]);
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* level-up double-burst shockwave */}
      {shock && (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 2,
              borderColor: c.ink,
              opacity: shock.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
              transform: [{ scale: shock.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2] }) }],
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1.5,
              borderColor: c.ink,
              opacity: shock.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.45, 0] }),
              transform: [{ scale: shock.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.85, 0.85, 2.2] }) }],
            }}
          />
        </>
      )}
      <Animated.View
        style={{ alignItems: "center", justifyContent: "center", transform: [{ scale }] }}
      >
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.ink} opacity={0.12} strokeWidth={stroke} />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={c.ink}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </Svg>
        <Text style={{ position: "absolute", fontFamily: fonts.displayBold, fontSize: size * 0.4, color: c.ink }}>
          {level}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * Level + XP progress, RPG-flavoured.
 *  • `compact` → a glowing level ring (header).
 *  • `full`    → a card with the ring, level name, a linear XP track, and the
 *                "X / Y XP · N to next" breakdown.
 * Pass `fireKey` (a changing nonce) + `gain`/`levelUpName` to play the +XP pop
 * and the inline level-up flare on demand (e.g. when landing on Today right
 * after a check-in). Drop in anywhere inside the StoreProvider.
 */
export default function XpBar({
  variant = "compact",
  onPress,
  fireKey,
  gain = 0,
  levelUpName,
}: {
  variant?: "compact" | "full";
  onPress?: () => void;
  fireKey?: string | number;
  gain?: number;
  levelUpName?: string;
}) {
  const { logs, wins } = useStore();
  const { c } = useTheme();
  const reduce = useReducedMotion();
  const info: LevelInfo = levelFor(xpFor(logs, wins));
  const isFull = variant === "full";

  const flare = useRef(new Animated.Value(0)).current; // ring scale pulse
  const pop = useRef(new Animated.Value(0)).current; // floating +XP
  const banner = useRef(new Animated.Value(0)).current; // level-up banner
  const shock = useRef(new Animated.Value(0)).current; // level-up shockwave ring
  const [popText, setPopText] = useState<string | null>(null);
  const [bannerText, setBannerText] = useState<string | null>(null);

  // Fire the celebration when a fresh nonce arrives with a positive gain.
  useEffect(() => {
    if (fireKey == null || gain <= 0) return;
    setPopText(`+${gain} XP`);
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 1300, easing: EASE, useNativeDriver: true }).start(
      () => setPopText(null)
    );
    if (!reduce) {
      Animated.sequence([
        Animated.timing(flare, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(flare, { toValue: 0, friction: 5, useNativeDriver: true }),
      ]).start();
    }
    if (levelUpName) {
      setBannerText(levelUpName);
      cheer("celebrate", "success"); // chime + success haptic (gated on prefs)
      if (!reduce) {
        shock.setValue(0);
        Animated.timing(shock, { toValue: 1, duration: 900, easing: EASE, useNativeDriver: true }).start();
      }
      banner.setValue(0);
      Animated.sequence([
        Animated.spring(banner, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(banner, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setBannerText(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireKey]);

  const ringScale = flare.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const popStyle = {
    opacity: pop.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
    transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [2, -22] }) }],
  };
  const bannerStyle = {
    opacity: banner,
    transform: [{ translateY: banner.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
  };

  const a11y = {
    accessibilityRole: "progressbar" as const,
    accessibilityValue: { min: 0, max: info.isMax ? 100 : info.span, now: info.isMax ? 100 : info.intoLevel },
    accessibilityLabel: info.isMax
      ? `Level ${info.level}, ${info.name}, max level`
      : `Level ${info.level}, ${info.name}, ${info.toNext} XP to next level`,
  };

  const ring = (size: number, stroke: number) => (
    <GlowRing pct={info.pct} level={info.level} size={size} stroke={stroke} c={c} scale={ringScale} shock={shock} />
  );

  const Pop = popText ? (
    <Animated.Text
      pointerEvents="none"
      style={[styles.pop, { color: c.ink }, popStyle]}
    >
      {popText}
    </Animated.Text>
  ) : null;

  const Banner = bannerText ? (
    <Animated.View
      pointerEvents="none"
      style={[styles.banner, { backgroundColor: c.surface, borderColor: c.line }, bannerStyle]}
    >
      <Ionicons name="flash" size={11} color={c.ink} />
      <Text style={[styles.bannerText, { color: c.ink }]}>LEVEL UP · {bannerText}</Text>
    </Animated.View>
  ) : null;

  if (!isFull) {
    const inner = (
      <View style={styles.compact} {...a11y}>
        {ring(34, 3)}
        {Pop}
        {Banner}
      </View>
    );
    return onPress ? (
      <PressableScale onPress={onPress} scaleTo={0.92} hitSlop={8}>
        {inner}
      </PressableScale>
    ) : (
      inner
    );
  }

  // full card
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]} {...a11y}>
      {ring(60, 5)}
      <View style={{ flex: 1 }}>
        <View style={styles.fullHead}>
          <View style={styles.row}>
            <Ionicons name="flash-outline" size={15} color={c.inkMuted} />
            <Text style={[styles.levelName, { color: c.ink }]}>{info.name}</Text>
          </View>
          <Text style={[styles.lvTag, { color: c.inkFaint }]}>LV {info.level}</Text>
        </View>
        <ProgressBar pct={info.pct} color={c.ink} track={c.line} height={8} rounded={4} style={{ marginTop: 10 }} />
        <View style={styles.fullFoot}>
          <Text style={[styles.footText, { color: c.inkMuted }]}>
            <Text style={{ color: c.ink, fontFamily: fonts.bodyBold }}>{info.intoLevel}</Text>
            {info.isMax ? "" : ` / ${info.span}`} XP
          </Text>
          <Text style={[styles.footText, { color: c.inkFaint }]}>
            {info.isMax ? "Max level reached" : `${info.toNext} XP to next`}
          </Text>
        </View>
      </View>
      {Pop}
      {Banner}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { alignItems: "center", justifyContent: "center" },
  pop: {
    position: "absolute",
    top: -6,
    alignSelf: "center",
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    fontWeight: "700",
  },
  banner: {
    position: "absolute",
    top: "100%",
    marginTop: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bannerText: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1, fontWeight: "700" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 18,
  },
  fullHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  levelName: { fontFamily: fonts.displayBold, fontSize: 17, letterSpacing: -0.3 },
  lvTag: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1 },
  fullFoot: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  footText: { fontFamily: fonts.mono, fontSize: 11 },
});
