import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, View } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, G } from "react-native-svg";

import { useTheme } from "@/lib/theme";

const { width: W, height: H } = Dimensions.get("window");

/** Ambient backdrop — a soft, slowly breathing top glow + faint dot field,
 *  echoing the web dashboard's dot-shader atmosphere. Behind transparent screens. */
export default function Backdrop() {
  const { isDark } = useTheme();
  const dotColor = isDark ? "#ffffff" : "#000000";
  const glow = isDark ? "#ffffff" : "#000000";
  const glowOpacity = isDark ? 0.07 : 0.04;

  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  const opacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  // Sparse dot grid that fades out over the top ~46% of the screen.
  const spacing = 28;
  const fadeTo = H * 0.46;
  const dots: { x: number; y: number; o: number }[] = [];
  for (let y = 22; y < fadeTo; y += spacing) {
    const o = (1 - y / fadeTo) * (isDark ? 0.1 : 0.055);
    if (o <= 0.004) continue;
    for (let x = 14; x < W; x += spacing) dots.push({ x, y, o });
  }

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Animated.View style={{ flex: 1, opacity }}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="24%" r="72%">
              <Stop offset="0%" stopColor={glow} stopOpacity={glowOpacity} />
              <Stop offset="55%" stopColor={glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#glow)" />
          <G>
            {dots.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={1.2} fill={dotColor} opacity={d.o} />
            ))}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
