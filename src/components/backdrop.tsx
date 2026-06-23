import { Dimensions, View } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

import { useTheme } from "@/lib/theme";

const { width: W, height: H } = Dimensions.get("window");

/** Light-theme / fallback backdrop — a clean, very soft top glow (no dots). */
export default function Backdrop() {
  const { isDark } = useTheme();
  const tint = isDark ? "#ffffff" : "#000000";
  const top = isDark ? 0.06 : 0.04;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient id="soft" cx="50%" cy="20%" r="75%">
            <Stop offset="0%" stopColor={tint} stopOpacity={top} />
            <Stop offset="60%" stopColor={tint} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill="url(#soft)" />
      </Svg>
    </View>
  );
}
