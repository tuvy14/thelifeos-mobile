import { View } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/lib/theme";

const MARK = require("../../assets/images/brandmark.png");
// Aspect of the trimmed brand-mark bounding box (see scripts/gen-brand-icons.js).
const ASPECT = 583 / 383;

/** TheLifeOS brand mark — the glowing infinity logo. The PNG is white-on-
 *  transparent and tinted to the theme's ink colour, so it reads on both light
 *  and dark backgrounds; a soft white glow is added in dark mode. */
export default function Logo({ height = 30, glow = true }: { height?: number; glow?: boolean }) {
  const { c, isDark } = useTheme();
  const width = height * ASPECT;
  return (
    <View
      style={
        glow && isDark
          ? { shadowColor: "#ffffff", shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }
          : undefined
      }
    >
      <Image source={MARK} tintColor={c.ink} style={{ width, height }} contentFit="contain" />
    </View>
  );
}
