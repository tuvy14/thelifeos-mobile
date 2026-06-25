import { useRef, useState } from "react";
import { View, PanResponder, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "@/lib/theme";
import { haptic } from "@/lib/feedback";

const TH = 22; // thumb diameter

/**
 * A custom glassy slider (no native slider, no new deps). A frosted BlurView
 * track with a glowing ink fill and a translucent glass thumb. Driven by a
 * PanResponder so tap-to-set and drag both work; horizontal-only intent keeps
 * it from stealing vertical scrolls. All dynamic values are read through refs
 * so the responder (created once) never goes stale.
 */
export function GlassSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onComplete,
  disabled = false,
  style,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  onComplete?: (v: number) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, isDark } = useTheme();
  const [w, setW] = useState(0);
  const wRef = useRef(0);
  // Latest props in a ref so the once-created responder always sees fresh values.
  const cfg = useRef({ onChange, onComplete, min, max, step, disabled });
  cfg.current = { onChange, onComplete, min, max, step, disabled };
  const lastVal = useRef(value);

  const apply = (x: number) => {
    const width = wRef.current;
    if (width <= 0) return;
    const { onChange, min, max, step } = cfg.current;
    const usable = Math.max(1, width - TH);
    const ratio = Math.max(0, Math.min(1, (x - TH / 2) / usable));
    let v = min + ratio * (max - min);
    v = Math.round(v / step) * step;
    v = Math.max(min, Math.min(max, v));
    if (v !== lastVal.current) {
      lastVal.current = v;
      haptic("selection");
    }
    onChange(v);
  };

  const responder = useRef(
    PanResponder.create({
      // CRITICAL for scrolling: never claim the touch on press-down — that would
      // trap a parent ScrollView. Only become the responder once the finger
      // moves clearly HORIZONTALLY; a vertical drag stays with the ScrollView.
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        !cfg.current.disabled && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (e) => apply(e.nativeEvent.locationX),
      onPanResponderMove: (e) => apply(e.nativeEvent.locationX),
      onPanResponderRelease: () => cfg.current.onComplete?.(lastVal.current),
      onPanResponderTerminate: () => cfg.current.onComplete?.(lastVal.current),
    })
  ).current;

  const clamped = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const usable = Math.max(0, w - TH);
  const thumbLeft = clamped * usable;
  const fillW = w > 0 ? thumbLeft + TH / 2 : 0;

  return (
    <View
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        wRef.current = width;
        setW(width);
      }}
      style={[styles.wrap, { opacity: disabled ? 0.45 : 1 }, style]}
      {...responder.panHandlers}
    >
      {/* glass track */}
      <View style={[styles.track, { borderColor: c.line, backgroundColor: c.fill }]}>
        <BlurView intensity={isDark ? 16 : 38} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        {/* glowing fill */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: fillW,
            backgroundColor: c.ink,
            borderRadius: 6,
            shadowColor: c.ink,
            shadowOpacity: 0.5,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {/* top sheen */}
          <View style={styles.sheen} />
        </View>
      </View>

      {/* glass thumb */}
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            left: thumbLeft,
            backgroundColor: c.ink,
            borderColor: isDark ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.6)",
          },
        ]}
      >
        <View style={styles.thumbHighlight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 30, justifyContent: "center" },
  track: { height: 12, borderRadius: 6, overflow: "hidden", borderWidth: 1 },
  sheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "50%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  thumb: {
    position: "absolute",
    top: (30 - TH) / 2,
    width: TH,
    height: TH,
    borderRadius: TH / 2,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  thumbHighlight: {
    position: "absolute",
    top: 3,
    left: "50%",
    marginLeft: -3.5,
    width: 7,
    height: 4,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
