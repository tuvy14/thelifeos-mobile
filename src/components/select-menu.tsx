import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { EASE, PressableScale } from "@/components/anim";

export type SelectOption = {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: ReactNode;
};

/** A native take on the framer-motion morphing Select: a compact pill that
 *  expands into a frosted card of options with a staggered spring-in, a header,
 *  and a close affordance. Fully theme-reactive + haptic. */
export default function SelectMenu({
  data,
  value,
  defaultValue,
  onChange,
  title = "Choose",
  placeholder = "Select…",
}: {
  data: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  title?: string;
  placeholder?: string;
}) {
  const { c, isDark } = useTheme();
  const s = makeStyles(c);

  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string | undefined>(defaultValue ?? data[0]?.value);
  const current = value ?? internal;
  const selected = data.find((d) => d.value === current) ?? data[0];

  // Modal entrance/exit.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!open) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  }, [open, anim]);

  const close = (cb?: () => void) => {
    Animated.timing(anim, { toValue: 0, duration: 160, easing: EASE, useNativeDriver: true }).start(() => {
      setOpen(false);
      cb?.();
    });
  };

  const pick = (v: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* ignore */ }
    if (value === undefined) setInternal(v);
    close(() => onChange?.(v));
  };

  const backdrop = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const cardY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <>
      {/* Collapsed pill */}
      <PressableScale style={s.pill} scaleTo={0.97} onPress={() => setOpen(true)}>
        {selected?.icon ? <View style={s.pillIcon}>{selected.icon}</View> : null}
        <Text style={s.pillLabel} numberOfLines={1}>{selected?.label ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={c.inkMuted} />
      </PressableScale>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => close()} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
          <Pressable style={s.backdrop} onPress={() => close()} />
        </Animated.View>

        <View style={s.center} pointerEvents="box-none">
          <Animated.View style={{ opacity: anim, transform: [{ scale: cardScale }, { translateY: cardY }], width: "100%", maxWidth: 420 }}>
            <BlurView intensity={isDark ? 50 : 70} tint={isDark ? "dark" : "light"} style={s.card}>
              <View style={[s.cardInner, { backgroundColor: c.card, borderColor: c.line }]}>
                <View style={s.head}>
                  <Text style={s.headTitle}>{title}</Text>
                  <Pressable onPress={() => close()} style={[s.x, { backgroundColor: c.fillStrong }]} hitSlop={8}>
                    <Ionicons name="close" size={14} color={c.inkMuted} />
                  </Pressable>
                </View>

                {data.map((item, i) => {
                  const on = item.value === current;
                  return (
                    <StaggerRow key={item.id} index={i} open={open}>
                      <Pressable
                        onPress={() => pick(item.value)}
                        style={({ pressed }) => [
                          s.row,
                          { backgroundColor: on ? c.fillStrong : pressed ? c.fill : "transparent" },
                        ]}
                      >
                        {item.icon ? <View style={[s.rowIcon, { borderColor: c.line }]}>{item.icon}</View> : null}
                        <View style={{ flex: 1 }}>
                          <Text style={s.rowLabel}>{item.label}</Text>
                          {item.description ? <Text style={s.rowDesc} numberOfLines={1}>{item.description}</Text> : null}
                        </View>
                        {on ? <Ionicons name="checkmark" size={18} color={c.ink} /> : null}
                      </Pressable>
                    </StaggerRow>
                  );
                })}
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

/** Each option fades+rises in with a per-index delay (the framer stagger). */
function StaggerRow({ children, index, open }: { children: ReactNode; index: number; open: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!open) { v.setValue(0); return; }
    const a = Animated.timing(v, { toValue: 1, duration: 360, delay: 60 + index * 45, easing: EASE, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [open, index, v]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    pill: {
      flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start",
      borderWidth: 1, borderColor: c.line, backgroundColor: c.card,
      borderRadius: radius.pill, paddingLeft: 8, paddingRight: 12, paddingVertical: 7,
    },
    pillIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: c.fill },
    pillLabel: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: c.ink, maxWidth: 200 },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
    card: { borderRadius: radius.xl, overflow: "hidden" },
    cardInner: { borderWidth: 1, borderRadius: radius.xl, paddingVertical: 8, paddingHorizontal: 8 },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 10 },
    headTitle: { fontFamily: fonts.display, fontSize: 16, color: c.ink },
    x: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 11 },
    rowIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    rowLabel: { fontFamily: fonts.bodySemibold, fontSize: 15, color: c.ink },
    rowDesc: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted, marginTop: 1 },
  });
