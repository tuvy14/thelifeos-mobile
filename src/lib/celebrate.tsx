import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts } from "@/lib/theme";

interface CelebrateCtx {
  celebrate: (message?: string) => void;
}
const Ctx = createContext<CelebrateCtx | null>(null);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const PIECES = 28;

function ConfettiBurst({ seed }: { seed: number }) {
  const { c, isDark } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const shades = isDark
    ? [c.ink, "rgba(255,255,255,0.7)", "rgba(255,255,255,0.4)"]
    : ["rgba(17,17,20,1)", "rgba(17,17,20,0.6)", "rgba(17,17,20,0.35)"];

  // Stable per-burst random params.
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }).map((_, i) => ({
        left: Math.random() * SCREEN_W,
        drift: (Math.random() - 0.5) * 220,
        size: 5 + Math.random() * 7,
        rounded: i % 3 === 0,
        rot: (Math.random() - 0.5) * 1080,
        color: shades[i % shades.length],
        delay: Math.random() * 0.2,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed]
  );

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.2, 0.6, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [seed, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SCREEN_H * 0.92],
        });
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rot}deg`] });
        const opacity = progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: p.rounded ? p.size : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

function Toast({ message }: { message: string }) {
  const { c } = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }).start();
  }, [v, message]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastWrap,
        { opacity: v, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Ionicons name="sparkles" size={15} color={c.ink} />
        <Text style={[styles.toastText, { color: c.ink }]} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [seed, setSeed] = useState(0);
  const [confettiOn, setConfettiOn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback((message?: string) => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* ignore */ }
    setSeed((s) => s + 1);
    setConfettiOn(true);
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfettiOn(false), 2100);
    if (message) {
      setToast(message);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && <Toast message={toast} />}
      {confettiOn && <ConfettiBurst seed={seed} />}
    </Ctx.Provider>
  );
}

export function useCelebrate(): CelebrateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { celebrate: () => {} };
  return ctx;
}

const styles = StyleSheet.create({
  toastWrap: { position: "absolute", top: 56, left: 0, right: 0, alignItems: "center", zIndex: 90 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  toastText: { fontFamily: fonts.bodyMedium, fontSize: 13, flexShrink: 1 },
});
