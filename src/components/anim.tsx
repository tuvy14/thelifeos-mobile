import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

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
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const press = () => {
    if (disabled) return;
    to(scaleTo);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* ignore */ }
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
