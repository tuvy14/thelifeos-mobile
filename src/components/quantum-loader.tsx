import { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";

import { useTheme, fonts } from "@/lib/theme";

/** "Generating" pulse loader — letters fade/lift in sequence + a sweeping bar.
 *  Mirrors the web QuantumPulseLoader. */
export default function QuantumLoader({ text = "Generating" }: { text?: string }) {
  const { c } = useTheme();
  const letters = text.split("");
  const vals = useRef(letters.map(() => new Animated.Value(0))).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = vals.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((letters.length - i) * 100),
        ])
      )
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    loops.forEach((l) => l.start());
    sweepLoop.start();
    return () => { loops.forEach((l) => l.stop()); sweepLoop.stop(); };
  }, [vals, sweep, letters.length]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {letters.map((ch, i) => {
          const opacity = vals[i].interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });
          const translateY = vals[i].interpolate({ inputRange: [0, 1], outputRange: [6, -4] });
          return (
            <Animated.Text
              key={i}
              style={[styles.letter, { color: c.ink, opacity, transform: [{ translateY }] }]}
            >
              {ch}
            </Animated.Text>
          );
        })}
      </View>
      <View style={[styles.track, { backgroundColor: c.fillStrong }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: c.ink,
              transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-220, 220] }) }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 24 },
  row: { flexDirection: "row" },
  letter: { fontFamily: fonts.displayBold, fontSize: 34, letterSpacing: 1 },
  track: { width: 220, height: 2, borderRadius: 99, overflow: "hidden" },
  fill: { width: 110, height: 2, borderRadius: 99 },
});
