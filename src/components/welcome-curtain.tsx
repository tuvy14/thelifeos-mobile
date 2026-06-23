import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const OBSIDIAN = "#0a0a0b";
const INK = "#fafafa";
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** A celebratory full-screen "welcome" curtain that plays once, the moment the
 *  user actually enters the app (after onboarding + unlocking). Logo blooms in,
 *  a personal greeting rises, then the whole thing fades to reveal the app. */
export default function WelcomeCurtain({ name, onDone }: { name?: string; onDone: () => void }) {
  const exit = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const greet = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const done = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 11, bounciness: 6 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 420, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 900, easing: EASE_OUT, useNativeDriver: true }),
    ]).start();
    Animated.timing(greet, { toValue: 1, duration: 520, delay: 360, easing: EASE_OUT, useNativeDriver: true }).start();
    Animated.timing(tag, { toValue: 1, duration: 520, delay: 640, easing: EASE_OUT, useNativeDriver: true }).start();

    const t = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      Animated.timing(exit, { toValue: 0, duration: 460, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(() => onDone());
    }, 2150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]}>
      <View style={styles.center}>
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
            shadowColor: "#ffffff",
            shadowOpacity: glow as unknown as number,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Svg width={118} height={76} viewBox="97 153 318 206" fill="none">
            <Circle cx={200} cy={256} r={88} stroke={INK} strokeWidth={30} />
            <Circle cx={312} cy={256} r={88} stroke={INK} strokeWidth={30} />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.greetWrap, rise(greet)]}>
          <Text style={styles.eyebrow}>WELCOME{name ? " BACK" : ""}</Text>
          <Text style={styles.greet}>{name ? name : "to TheLifeOS"}</Text>
        </Animated.View>

        <Animated.Text style={[styles.tagline, rise(tag)]}>
          Let&apos;s build today, one small win at a time.
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: OBSIDIAN, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", paddingHorizontal: 32 },
  greetWrap: { alignItems: "center", marginTop: 28 },
  eyebrow: { color: "rgba(250,250,250,0.5)", fontSize: 12, letterSpacing: 3.5, fontWeight: "700", marginBottom: 8 },
  greet: { color: INK, fontSize: 40, fontWeight: "800", letterSpacing: -1, textAlign: "center" },
  tagline: { color: "rgba(250,250,250,0.62)", fontSize: 15, textAlign: "center", marginTop: 16, lineHeight: 21 },
});
