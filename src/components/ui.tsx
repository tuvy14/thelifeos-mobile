import { View, Text, TextInput, Pressable, StyleSheet, type ViewStyle, type TextStyle, type StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";

/* ── Glass surface card (web .surface-card) ── */
export function Card({
  children,
  style,
  padding = 20,
  rounded = radius.lg,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  rounded?: number;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderColor: c.line,
          borderWidth: 1,
          borderRadius: rounded,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ── Eyebrow (mono, uppercase, leading dash) ── */
export function Eyebrow({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const { c } = useTheme();
  return (
    <View style={styles.eyebrowRow}>
      <View style={[styles.eyebrowDash, { backgroundColor: c.ink }]} />
      <Text style={[styles.eyebrowText, { color: c.ink }, style]}>{children}</Text>
    </View>
  );
}

/* ── Rounded-square icon badge (web h-9 w-9 border bg-white/3) ── */
export function IconBadge({
  name,
  size = 16,
  box = 36,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  box?: number;
  color?: string;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: c.fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size} color={color ?? c.ink} />
    </View>
  );
}

/* ── Primary (ink) button ── */
export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: c.ink,
          borderRadius: radius.md,
          paddingVertical: 15,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={17} color={c.obsidian} />}
      <Text style={{ color: c.obsidian, fontFamily: fonts.displayBold, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

/* ── Pill chip (optionally highlighted) ── */
export function Chip({ children, active }: { children: ReactNode; active?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? c.chipBorder : c.line,
        backgroundColor: active ? c.chipBg : c.fill,
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
    >
      <Text style={{ color: c.ink, fontFamily: fonts.monoMedium, fontSize: 12 }}>{children}</Text>
    </View>
  );
}

/* ── Empty state ── */
export function EmptyState({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 12, paddingVertical: 48 }}>
      <Ionicons name={icon} size={30} color={c.inkFaint} />
      <Text style={{ color: c.inkFaint, fontFamily: fonts.body, fontSize: 14, textAlign: "center" }}>
        {text}
      </Text>
    </View>
  );
}

/* ── Styled text input ── */
export function Field(props: React.ComponentProps<typeof TextInput>) {
  const { c } = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.inkFaint}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: radius.md,
          backgroundColor: c.fill,
          paddingHorizontal: 14,
          paddingVertical: 13,
          color: c.ink,
          fontFamily: fonts.body,
          fontSize: 14,
        },
        props.style,
      ]}
    />
  );
}

/* Convenience text-style helpers bound to the active palette. */
export function useType(c: Palette) {
  return {
    eyebrow: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: c.ink },
    title: { fontFamily: fonts.displayBold, fontSize: 28, color: c.ink, letterSpacing: -0.5 },
    h2: { fontFamily: fonts.displayBold, fontSize: 30, color: c.ink, letterSpacing: -0.6 },
    cardTitle: { fontFamily: fonts.display, fontSize: 17, color: c.ink },
    body: { fontFamily: fonts.body, fontSize: 14, color: c.inkMuted },
    faint: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint },
  };
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrowDash: { width: 18, height: 1, opacity: 0.7 },
  eyebrowText: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});
