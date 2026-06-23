import { useEffect, useRef } from "react";
import { Animated, Easing, View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

const OBSIDIAN = "#0a0a0b";
const INK = "#fafafa";

/** Branded startup screen — self-contained (no theme/font deps so it can render
 *  before providers/fonts are ready). Glowing two-circle mark that breathes. */
export default function Splash() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const s = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    p.start();
    s.start();
    return () => { p.stop(); s.stop(); };
  }, [pulse, sweep]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] });

  return (
    <View style={styles.root}>
      <Animated.View
        style={{
          transform: [{ scale }],
          shadowColor: "#ffffff",
          shadowOpacity: glow as unknown as number,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Svg width={132} height={86} viewBox="97 153 318 206" fill="none">
          <Circle cx={200} cy={256} r={88} stroke={INK} strokeWidth={30} />
          <Circle cx={312} cy={256} r={88} stroke={INK} strokeWidth={30} />
        </Svg>
      </Animated.View>

      <Text style={styles.wordmark}>
        TheLife<Text style={{ color: "rgba(250,250,250,0.55)" }}>OS</Text>
      </Text>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OBSIDIAN, alignItems: "center", justifyContent: "center", gap: 22 },
  wordmark: { color: INK, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  track: { width: 120, height: 2, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden", marginTop: 4 },
  fill: { width: 60, height: 2, borderRadius: 99, backgroundColor: INK },
});
