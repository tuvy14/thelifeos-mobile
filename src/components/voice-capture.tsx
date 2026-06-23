import { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import { useTheme } from "@/lib/theme";

/** Live mic capture (dev build only — gated by voiceSupported in the parent).
 *  Starts on mount, streams interim transcript via onTranscript, and calls
 *  onDone(final) when speech ends. Renders an animated listening waveform. */
export default function VoiceCapture({
  onTranscript,
  onDone,
}: {
  onTranscript: (t: string) => void;
  onDone: (final: string) => void;
}) {
  const { c } = useTheme();
  const latest = useRef("");
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone(latest.current.trim());
  };

  useSpeechRecognitionEvent("result", (e) => {
    const t = (e as { results?: { transcript?: string }[] }).results?.[0]?.transcript ?? "";
    latest.current = t;
    onTranscript(t);
  });
  useSpeechRecognitionEvent("end", finish);
  useSpeechRecognitionEvent("error", finish);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (cancelled) return;
        if (!perm.granted) {
          finish();
          return;
        }
        // continuous + interim so it keeps listening until the user taps stop
        // (non-continuous cut off mid-sentence and dropped words). Punctuation
        // and server recognition give noticeably better transcripts.
        ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          interimResults: true,
          continuous: true,
          addsPunctuation: true,
          requiresOnDeviceRecognition: false,
        });
      } catch {
        finish();
      }
    })();
    return () => {
      cancelled = true;
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Waveform color={c.ink} />;
}

function Waveform({ color }: { color: string }) {
  const bars = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const anims = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 90),
          Animated.timing(b, { toValue: 1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(b, { toValue: 0.3, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [bars]);
  return (
    <View style={styles.row}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            borderRadius: 2,
            backgroundColor: color,
            height: b.interpolate({ inputRange: [0, 1], outputRange: [6, 30] }),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5, height: 32 },
});
