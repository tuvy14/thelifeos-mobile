import { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";

const OBSIDIAN = "#0a0a0b";
const INK = "#fafafa";

/** Branded startup screen — self-contained (no theme/font deps so it can render
 *  before providers/fonts are ready). Pulsing infinity mark + a sweeping bar. */
export default function Splash() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const s = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    p.start();
    s.start();
    return () => { p.stop(); s.stop(); };
  }, [pulse, sweep]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] });

  return (
    <View style={styles.root}>
      <Animated.View style={{ transform: [{ scale }], shadowColor: "#fff", shadowOpacity: glow as unknown as number, shadowRadius: 16 }}>
        <Svg width={104} height={52} viewBox="0 0 96 48" fill="none">
          <G stroke={INK} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M44 24C44 6 8 6 8 24C8 42 44 42 44 24C44 6 80 6 80 24C80 42 44 42 44 24" />
            <Circle cx={62} cy={24} r={10.5} />
            <Circle cx={62} cy={24} r={2.4} fill={INK} />
          </G>
        </Svg>
      </Animated.View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OBSIDIAN, alignItems: "center", justifyContent: "center", gap: 28 },
  track: { width: 120, height: 2, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  fill: { width: 60, height: 2, borderRadius: 99, backgroundColor: INK },
});
