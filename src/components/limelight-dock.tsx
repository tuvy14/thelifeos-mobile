import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Polygon, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/lib/theme";
import { EASE } from "@/components/anim";

/** Minimal shape of the props expo-router/React-Navigation passes to a custom
 *  `tabBar` — typed locally since the full BottomTabBarProps isn't re-exported. */
type DockRoute = { key: string; name: string };
type DockProps = {
  state: { index: number; routes: DockRoute[] };
  navigation: {
    emit: (e: { type: "tabPress"; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

/** Per-route icon: [active (filled), inactive (outline)]. */
const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index: ["today", "today-outline"],
  "check-in": ["checkmark-circle", "checkmark-circle-outline"],
  wins: ["sparkles", "sparkles-outline"],
  insights: ["stats-chart", "stats-chart-outline"],
  more: ["grid", "grid-outline"],
};

const BEAM_W = 44;
const CONE_W = 76;
const CONE_H = 48;
const BAR_H = 60;

/** A dock icon that springs up + brightens when it becomes the active tab,
 *  giving each tab switch a satisfying pop in sync with the light beam. */
function DockIcon({
  active,
  activeIcon,
  inactiveIcon,
  color,
}: {
  active: boolean;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const scale = useRef(new Animated.Value(active ? 1.14 : 1)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.14 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  }, [active, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={active ? activeIcon : inactiveIcon}
        size={24}
        color={color}
        style={{ opacity: active ? 1 : 0.4 }}
      />
    </Animated.View>
  );
}

/** The web "LimelightNav" reimagined for React Native: a frosted dock whose
 *  active icon is lit by a sliding light beam + glow cone. Replaces the stock
 *  bottom tab bar (passed to <Tabs tabBar={...} />). */
export default function LimelightDock({ state, navigation }: DockProps) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Measured horizontal centre of every tab, used to position the beam.
  const [centers, setCenters] = useState<number[]>([]);
  const beamX = useRef(new Animated.Value(0)).current;
  const ready = useRef(false);
  const fade = useRef(new Animated.Value(0)).current;

  const active = state.index;

  // Slide the beam to the active tab whenever it (or the measurements) change.
  useEffect(() => {
    const x = centers[active];
    if (x == null) return;
    const target = x - CONE_W / 2;
    if (!ready.current) {
      beamX.setValue(target);
      ready.current = true;
      Animated.timing(fade, { toValue: 1, duration: 260, easing: EASE, useNativeDriver: true }).start();
    } else {
      Animated.spring(beamX, { toValue: target, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
    }
  }, [active, centers, beamX, fade]);

  const onItemLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    const center = x + width / 2;
    setCenters((prev) => {
      if (prev[i] === center) return prev;
      const next = [...prev];
      next[i] = center;
      return next;
    });
  };

  const onPress = (i: number, routeKey: string, routeName: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* ignore */ }
    const event = navigation.emit({ type: "tabPress", target: routeKey, canPreventDefault: true });
    if (i !== active && !event.defaultPrevented) navigation.navigate(routeName);
  };

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom, backgroundColor: isDark ? "rgba(10,10,11,0.7)" : "rgba(240,241,244,0.7)", borderTopColor: c.line },
      ]}
    >
      <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

      {/* The travelling limelight (beam + light cone). */}
      <Animated.View
        pointerEvents="none"
        style={[styles.limelight, { width: CONE_W, opacity: fade, transform: [{ translateX: beamX }] }]}
      >
        <View
          style={[
            styles.beam,
            { backgroundColor: c.ink, shadowColor: c.ink, left: (CONE_W - BEAM_W) / 2 },
          ]}
        />
        <Svg width={CONE_W} height={CONE_H} style={{ position: "absolute", top: 4 }}>
          <Defs>
            <LinearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.ink} stopOpacity={isDark ? 0.28 : 0.18} />
              <Stop offset="1" stopColor={c.ink} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Polygon
            points={`${CONE_W * 0.08},${CONE_H} ${CONE_W * 0.3},0 ${CONE_W * 0.7},0 ${CONE_W * 0.92},${CONE_H}`}
            fill="url(#cone)"
          />
        </Svg>
      </Animated.View>

      {/* Tab row */}
      <View style={[styles.row, { height: BAR_H }]}>
        {state.routes.map((route, i) => {
          const [activeIcon, inactiveIcon] = ICONS[route.name] ?? ["ellipse", "ellipse-outline"];
          const isActive = i === active;
          return (
            <Pressable
              key={route.key}
              onLayout={onItemLayout(i)}
              onPress={() => onPress(i, route.key, route.name)}
              style={styles.item}
              hitSlop={6}
            >
              <DockIcon
                active={isActive}
                activeIcon={activeIcon}
                inactiveIcon={inactiveIcon}
                color={c.ink}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8 },
  item: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  limelight: { position: "absolute", top: 0, left: 0, height: CONE_H, alignItems: "center" },
  beam: {
    position: "absolute",
    top: 0,
    width: BEAM_W,
    height: 5,
    borderRadius: 3,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
