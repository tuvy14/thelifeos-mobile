import { useEffect, useRef, useState } from "react";
import { Animated, View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme, fonts } from "@/lib/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Circular life-score ring with the score centered — mirrors the web ScoreRing. */
export default function ScoreRing({
  score,
  size = 132,
  stroke = 9,
  showLabel = true,
}: {
  score: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const { c } = useTheme();
  const clamped = Math.min(Math.max(score, 0), 100);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;

  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let lastN = -1;
    const id = progress.addListener(({ value }) => {
      const n = Math.round(value * 100);
      if (n !== lastN) {
        lastN = n; // only re-render on integer changes (≤100 instead of ~60/sec)
        setShown(n);
      }
    });
    const anim = Animated.timing(progress, {
      toValue: clamped / 100,
      duration: 900,
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      progress.removeListener(id);
      anim.stop();
    };
  }, [clamped, progress]);

  const offset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={c.ink}
          opacity={0.1}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={c.ink}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </Svg>
      {showLabel && (
        <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: size * 0.37, color: c.ink, letterSpacing: -1 }}>
            {shown}
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: c.inkFaint, marginTop: -2 }}>
            / 100
          </Text>
        </View>
      )}
    </View>
  );
}
