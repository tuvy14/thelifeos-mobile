// Unified tactile + audio feedback. One place that owns haptics + UI sound
// effects, both gated on user prefs (persisted in AsyncStorage) and safe to call
// from anywhere — every entry point no-ops on web / on failure, so callers never
// need to guard. PressableScale + celebrate route through here so the global
// toggles actually take effect everywhere.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

const K_SOUND = "lifeos_sound";
const K_HAPTICS = "lifeos_haptics";
const K_VOLUME = "lifeos_volume"; // "0".."100" percent (shares the web's key/format)

export interface FeedbackPrefs {
  sound: boolean;
  haptics: boolean;
  volume: number; // 0-100
}

// In-memory source of truth (loaded once below). Mutators write through to disk
// and notify subscribers so the Settings UI stays in sync.
const prefs: FeedbackPrefs = { sound: true, haptics: true, volume: 70 };
const listeners = new Set<(p: FeedbackPrefs) => void>();
const emit = () => listeners.forEach((l) => l({ ...prefs }));

(async () => {
  try {
    const [[, s], [, h], [, v]] = await AsyncStorage.multiGet([K_SOUND, K_HAPTICS, K_VOLUME]);
    if (s != null) prefs.sound = s !== "0";
    if (h != null) prefs.haptics = h !== "0";
    if (v != null) prefs.volume = Math.max(0, Math.min(100, Math.round(Number(v)) || 0));
    applyVolume();
    emit();
  } catch {
    /* keep defaults */
  }
})();

export function setSoundEnabled(on: boolean) {
  prefs.sound = on;
  AsyncStorage.setItem(K_SOUND, on ? "1" : "0").catch(() => {});
  emit();
}
export function setHapticsEnabled(on: boolean) {
  prefs.haptics = on;
  AsyncStorage.setItem(K_HAPTICS, on ? "1" : "0").catch(() => {});
  emit();
}
export function setVolume(pct: number) {
  prefs.volume = Math.max(0, Math.min(100, Math.round(pct)));
  AsyncStorage.setItem(K_VOLUME, String(prefs.volume)).catch(() => {});
  applyVolume();
  emit();
}

/** Reactive view of the prefs for the Settings screen. */
export function useFeedbackPrefs(): FeedbackPrefs {
  const [p, setP] = useState<FeedbackPrefs>({ ...prefs });
  useEffect(() => {
    const l = (np: FeedbackPrefs) => setP(np);
    listeners.add(l);
    setP({ ...prefs }); // catch the async load if it landed before mount
    return () => {
      listeners.delete(l);
    };
  }, []);
  return p;
}

// ── Haptics ────────────────────────────────────────────────────────────────
export type HapticKind = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export function haptic(kind: HapticKind = "light") {
  if (!prefs.haptics || Platform.OS === "web") return;
  try {
    switch (kind) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "selection":
        Haptics.selectionAsync();
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    /* haptics unsupported on this device */
  }
}

// ── Sound effects ────────────────────────────────────────────────────────────
export type SfxName = "success" | "win" | "celebrate" | "checkin";

const SOURCES: Record<SfxName, number> = {
  success: require("../../assets/sounds/success.wav"),
  win: require("../../assets/sounds/win.wav"),
  celebrate: require("../../assets/sounds/celebrate.wav"),
  checkin: require("../../assets/sounds/checkin.wav"),
};

// Players are created lazily and reused (cheap to keep the clips loaded).
const players: Partial<Record<SfxName, AudioPlayer>> = {};
let audioModeSet = false;

// Push the current volume (0-1) onto every loaded player.
function applyVolume() {
  const v = Math.max(0, Math.min(1, prefs.volume / 100));
  (Object.keys(players) as SfxName[]).forEach((k) => {
    const p = players[k];
    if (p) {
      try {
        p.volume = v;
      } catch {
        /* ignore */
      }
    }
  });
}

export function playSfx(name: SfxName) {
  if (!prefs.sound || Platform.OS === "web") return;
  if (prefs.volume <= 0) return;
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      // Respect the hardware ring/silent switch — UI sounds shouldn't override it.
      setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
    }
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players[name] = p;
    }
    try {
      p.volume = Math.max(0, Math.min(1, prefs.volume / 100));
    } catch {
      /* ignore */
    }
    p.seekTo(0);
    p.play();
  } catch {
    /* audio unavailable */
  }
}

/** Fire both at once for a "something good happened" moment. */
export function cheer(sfx: SfxName = "celebrate", h: HapticKind = "success") {
  haptic(h);
  playSfx(sfx);
}
