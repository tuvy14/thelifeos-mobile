import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { haptic, type HapticKind } from "@/lib/feedback";

/** The web app's signature easing (framer `[0.16, 1, 0.3, 1]`). */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that springs down on press — the web's hover/active scale.
 *  Drop-in for <Pressable>: style + layout (incl. flex/row) apply to the
 *  pressable itself, so it works for buttons, rows, chips and flex children. */
export function PressableScale({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
  hitSlop,
  scaleTo = 0.96,
  haptics = "light",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
  scaleTo?: number;
  haptics?: HapticKind | false;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const press = () => {
    if (disabled) return;
    to(scaleTo);
    if (haptics) haptic(haptics);
  };
  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={press}
      onPressOut={() => to(1)}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Fade + rise in on mount — the web's whileInView card reveal. Stagger via delay. */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  duration = 480,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [v, delay, duration]);
  const opacity = v;
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] });
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** A number that counts up from 0 to `value` on mount/change. */
export function CountUp({
  value,
  duration = 900,
  format,
  style,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  // Keep the latest formatter in a ref so a fresh `format` identity each render
  // (e.g. inline arrows) doesn't restart the animation.
  const fmtRef = useRef<(n: number) => string>(format ?? ((n) => String(Math.round(n))));
  fmtRef.current = format ?? ((n) => String(Math.round(n)));
  const [text, setText] = useState(() => fmtRef.current(0));
  const last = useRef<string | null>(null);
  useEffect(() => {
    last.current = null;
    const id = v.addListener(({ value: x }) => {
      const next = fmtRef.current(x);
      // Only re-render when the displayed string actually changes — turns ~60
      // re-renders/sec into at most one per distinct value.
      if (next !== last.current) {
        last.current = next;
        setText(next);
      }
    });
    v.setValue(0);
    const anim = Animated.timing(v, { toValue: value, duration, easing: EASE, useNativeDriver: false });
    anim.start();
    return () => {
      v.removeListener(id);
      anim.stop();
    };
  }, [value, duration, v]);
  return <Text style={style}>{text}</Text>;
}

/** A slow, gentle breathing scale — draws the eye to a primary CTA without
 *  shouting. No-ops (renders flat) when `active` is false. */
export function Pulse({
  children,
  active = true,
  style,
}: {
  children: ReactNode;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1150, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1150, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

/** A vertical bar whose height grows from 0 → `pct`% on mount. Drop into a
 *  flex-end track for an animated column chart. `delay` staggers a row. */
export function GrowBar({
  pct,
  color,
  delay = 0,
  rounded = 3,
  minHeight = 4,
  style,
}: {
  pct: number;
  color: string;
  delay?: number;
  rounded?: number;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const target = Math.max(0, Math.min(100, pct));
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 720,
      delay,
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [target, delay, v]);
  const height = v.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${target}%`] });
  return (
    <Animated.View
      style={[
        { width: "100%", height, borderRadius: rounded, backgroundColor: color, minHeight: target > 0 ? minHeight : 0 },
        style,
      ]}
    />
  );
}

/** A progress bar whose fill animates to `pct` (0–100) on mount/change. */
export function ProgressBar({
  pct,
  color,
  track,
  height = 8,
  rounded = 4,
  style,
}: {
  pct: number;
  color: string;
  track: string;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: Math.max(0, Math.min(1, pct / 100)),
      duration: 700,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [pct, v]);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={[{ height, borderRadius: rounded, backgroundColor: track, overflow: "hidden" }, style]}>
      <Animated.View style={{ height, borderRadius: rounded, backgroundColor: color, width }} />
    </View>
  );
}
