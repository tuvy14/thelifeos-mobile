import { View } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";

import { useTheme } from "@/lib/theme";

/** TheLifeOS brand mark — the website's infinity-with-rings logo, optional glow. */
export default function Logo({ height = 32, glow = true }: { height?: number; glow?: boolean }) {
  const { c, isDark } = useTheme();
  const width = height * 2; // viewBox is 96×48
  return (
    <View
      style={
        glow && isDark
          ? {
              shadowColor: "#ffffff",
              shadowOpacity: 0.55,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
            }
          : undefined
      }
    >
      <Svg width={width} height={height} viewBox="0 0 96 48" fill="none">
        <G stroke={c.ink} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M44 24C44 6 8 6 8 24C8 42 44 42 44 24C44 6 80 6 80 24C80 42 44 42 44 24" />
          <Circle cx={62} cy={24} r={10.5} />
          <Circle cx={62} cy={24} r={2.4} fill={c.ink} />
        </G>
      </Svg>
    </View>
  );
}
