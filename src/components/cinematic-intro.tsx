import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

const { width: W, height: H } = Dimensions.get("window");

const OBSIDIAN = "#0a0a0b";
const INK = "#fafafa";

// Total run of the auto-playing timeline (ms). User never touches anything.
const TOTAL = 5200;

const AView = Animated.createAnimatedComponent(View);

/** A self-playing, HORIZON-style cinematic intro reimagined for TheLifeOS.
 *  A glowing horizon "sunrise" rises while three text beats auto-scroll past —
 *  no input required — landing on the brand mark. Tap "Skip" to jump in. */
export default function CinematicIntro({ onDone }: { onDone: () => void }) {
  // One linear master clock drives the whole timeline; everything interpolates off it.
  const clock = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current; // overlay opacity (1 → 0 on finish)
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(exit, { toValue: 0, duration: 460, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
      () => onDone()
    );
  };

  useEffect(() => {
    const run = Animated.timing(clock, { toValue: 1, duration: TOTAL, easing: Easing.linear, useNativeDriver: true });
    run.start(({ finished: done }) => { if (done) finish(); });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera: scroll the stacked frames upward through three resting beats.
  const sceneY = clock.interpolate({
    inputRange: [0, 0.22, 0.40, 0.56, 0.74, 1],
    outputRange: [0, 0, -H, -H, -2 * H, -2 * H],
  });

  // Horizon "sun" slowly rises and brightens (parallax behind the text).
  const sunY = clock.interpolate({ inputRange: [0, 1], outputRange: [60, -24] });
  const sunOpacity = clock.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.55, 0.95, 0.8] });

  // Per-beat entrance reveals (fade + rise) as each scrolls toward centre.
  const beat = (start: number) => ({
    opacity: clock.interpolate({ inputRange: [start, start + 0.1], outputRange: [0, 1], extrapolate: "clamp" }),
    transform: [
      { translateY: clock.interpolate({ inputRange: [start, start + 0.12], outputRange: [22, 0], extrapolate: "clamp" }) },
    ],
  });

  const logoScale = clock.interpolate({ inputRange: [0.62, 0.82], outputRange: [0.82, 1], extrapolate: "clamp" });
  const logoGlow = clock.interpolate({ inputRange: [0.62, 0.86], outputRange: [0.2, 0.9], extrapolate: "clamp" });
  const progress = clock.interpolate({ inputRange: [0, 1], outputRange: [0, W - 48] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]}>
      {/* Ambient field + vignette */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id="amb" cx="50%" cy="32%" r="75%">
              <Stop offset="0%" stopColor="#16161a" stopOpacity={1} />
              <Stop offset="100%" stopColor={OBSIDIAN} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#amb)" />
        </Svg>
      </View>

      {/* Horizon sunrise (parallax layer) */}
      <AView pointerEvents="none" style={[styles.sun, { opacity: sunOpacity, transform: [{ translateY: sunY }] }]}>
        <Svg width={W} height={H * 0.7}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="100%" r="70%">
              <Stop offset="0%" stopColor={INK} stopOpacity={0.5} />
              <Stop offset="40%" stopColor={INK} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={INK} stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id="line" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={INK} stopOpacity={0} />
              <Stop offset="0.5" stopColor={INK} stopOpacity={0.5} />
              <Stop offset="1" stopColor={INK} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {/* glow halo */}
          <Ellipse cx={W / 2} cy={H * 0.7} rx={W * 0.9} ry={H * 0.5} fill="url(#halo)" />
          {/* the rising sun disc */}
          <Circle cx={W / 2} cy={H * 0.7} r={W * 0.34} fill={INK} fillOpacity={0.08} />
          <Circle cx={W / 2} cy={H * 0.7} r={W * 0.34} stroke={INK} strokeOpacity={0.22} strokeWidth={1} fill="none" />
          {/* horizon line */}
          <Rect x={0} y={H * 0.7} width={W} height={1.4} fill="url(#line)" />
        </Svg>
      </AView>

      {/* Auto-scrolling text beats */}
      <Animated.View style={[styles.scene, { transform: [{ translateY: sceneY }] }]}>
        <View style={styles.frame}>
          <Animated.View style={beat(0)}>
            <Text style={styles.eyebrow}>WELCOME TO YOUR</Text>
            <Text style={styles.big}>One calm place</Text>
          </Animated.View>
        </View>

        <View style={styles.frame}>
          <Animated.View style={beat(0.30)}>
            <Text style={styles.big}>for your whole life.</Text>
            <Text style={styles.subtle}>Track everything. Carry nothing.</Text>
          </Animated.View>
        </View>

        <View style={styles.frame}>
          <Animated.View style={[styles.finalWrap, beat(0.62)]}>
            <Animated.View
              style={{
                transform: [{ scale: logoScale }],
                shadowColor: "#ffffff",
                shadowOpacity: logoGlow as unknown as number,
                shadowRadius: 26,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Svg width={120} height={78} viewBox="97 153 318 206" fill="none">
                <Circle cx={200} cy={256} r={88} stroke={INK} strokeWidth={30} />
                <Circle cx={312} cy={256} r={88} stroke={INK} strokeWidth={30} />
              </Svg>
            </Animated.View>
            <Text style={styles.wordmark}>
              TheLife<Text style={{ color: "rgba(250,250,250,0.55)" }}>OS</Text>
            </Text>
            <Text style={styles.tagline}>Built from small wins, every day.</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Skip */}
      <Pressable style={styles.skip} onPress={finish} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Auto progress */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: progress }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: OBSIDIAN },
  sun: { position: "absolute", left: 0, right: 0, bottom: 0 },
  scene: { position: "absolute", left: 0, right: 0, top: 0, height: 3 * H },
  frame: { height: H, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  finalWrap: { alignItems: "center", gap: 18 },
  eyebrow: { color: "rgba(250,250,250,0.5)", fontSize: 13, letterSpacing: 3, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  big: { color: INK, fontSize: 34, fontWeight: "800", letterSpacing: -1, textAlign: "center", lineHeight: 40 },
  subtle: { color: "rgba(250,250,250,0.55)", fontSize: 15, textAlign: "center", marginTop: 14 },
  wordmark: { color: INK, fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  tagline: { color: "rgba(250,250,250,0.6)", fontSize: 14, textAlign: "center" },
  skip: { position: "absolute", top: 54, right: 22, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: "rgba(250,250,250,0.18)" },
  skipText: { color: "rgba(250,250,250,0.7)", fontSize: 13, fontWeight: "600" },
  track: { position: "absolute", left: 24, right: 24, bottom: 46, height: 2, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  fill: { height: 2, borderRadius: 99, backgroundColor: INK },
});
