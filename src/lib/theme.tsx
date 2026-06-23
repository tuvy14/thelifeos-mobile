import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* Monochrome palette — mirrors the web app's globals.css tokens exactly. */
export interface Palette {
  obsidian: string; // app background
  surface: string; // solid raised surface (segmented controls etc.)
  card: string; // translucent glass card fill over obsidian
  fill: string; // micro overlay (inputs, icon boxes)
  fillStrong: string; // hover/active overlay
  ink: string;
  inkMuted: string;
  inkFaint: string;
  line: string;
  lineStrong: string;
  chipBg: string; // highlighted pill bg (ink/10)
  chipBorder: string; // highlighted pill border (ink/30)
  danger: string;
}

export const DARK: Palette = {
  obsidian: "rgb(10,10,11)",
  surface: "rgb(22,22,24)",
  card: "rgba(255,255,255,0.03)",
  fill: "rgba(255,255,255,0.03)",
  fillStrong: "rgba(255,255,255,0.06)",
  ink: "rgb(250,250,250)",
  inkMuted: "rgb(161,161,170)",
  inkFaint: "rgb(107,107,115)",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.22)",
  chipBg: "rgba(250,250,250,0.10)",
  chipBorder: "rgba(250,250,250,0.30)",
  danger: "#ff6b6b",
};

export const LIGHT: Palette = {
  obsidian: "rgb(240,241,244)", // soft light-gray app bg so white cards lift off it
  surface: "rgb(255,255,255)",
  card: "rgba(255,255,255,0.78)", // frosted white card (over blur)
  fill: "rgba(0,0,0,0.045)",
  fillStrong: "rgba(0,0,0,0.07)",
  ink: "rgb(17,17,20)",
  inkMuted: "rgb(60,60,68)",
  inkFaint: "rgb(120,120,130)",
  line: "rgba(0,0,0,0.12)",
  lineStrong: "rgba(0,0,0,0.24)",
  chipBg: "rgba(17,17,20,0.08)",
  chipBorder: "rgba(17,17,20,0.28)",
  danger: "#d4353b",
};

/** Back-compat default export (dark). Prefer useTheme() for new code. */
export const theme = DARK;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 9999 } as const;
export const space = (n: number) => n * 4;

/* Font families (loaded in _layout via @expo-google-fonts). */
export const fonts = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  display: "Sora_700Bold",
  displaySemibold: "Sora_600SemiBold",
  displayBold: "Sora_800ExtraBold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
  monoSemibold: "JetBrainsMono_600SemiBold",
} as const;

type Mode = "dark" | "light";
interface ThemeCtx {
  mode: Mode;
  c: Palette;
  isDark: boolean;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const K_THEME = "lifeos_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(K_THEME)
      .then((v) => {
        if (v === "light" || v === "dark") setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(K_THEME, m).catch(() => {});
  }, []);
  const toggle = useCallback(() => {
    setModeState((m) => {
      const next = m === "dark" ? "light" : "dark";
      AsyncStorage.setItem(K_THEME, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ mode, c: mode === "dark" ? DARK : LIGHT, isDark: mode === "dark", toggle, setMode }),
    [mode, toggle, setMode]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
