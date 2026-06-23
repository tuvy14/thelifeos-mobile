// Monochrome brand palette — mirrors the web app (obsidian / ink tokens).
export const theme = {
  obsidian: "#0a0a0b",
  surface: "#141416",
  surfaceAlt: "#1b1b1e",
  ink: "#fafafa",
  inkMuted: "#a1a1aa",
  inkFaint: "#6b6b73",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.18)",
  accent: "#fafafa", // monochrome: "accent" is just white-on-black
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 9999 } as const;

export const space = (n: number) => n * 4;
