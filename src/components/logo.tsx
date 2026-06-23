import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/lib/theme";

/** TheLifeOS brand mark — the website's two-overlapping-circles icon (icon.svg),
 *  white stroke + soft glow. */
export default function Logo({ height = 30, glow = true }: { height?: number; glow?: boolean }) {
  const { c, isDark } = useTheme();
  // viewBox tightly framing the two r=88 circles centered at x=200 & 312, y=256.
  const aspect = 318 / 206;
  const width = height * aspect;
  return (
    <View
      style={
        glow && isDark
          ? { shadowColor: "#ffffff", shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }
          : undefined
      }
    >
      <Svg width={width} height={height} viewBox="97 153 318 206" fill="none">
        <Circle cx={200} cy={256} r={88} stroke={c.ink} strokeWidth={30} />
        <Circle cx={312} cy={256} r={88} stroke={c.ink} strokeWidth={30} />
      </Svg>
    </View>
  );
}
