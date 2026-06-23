import { ScrollView, type ScrollViewProps } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/lib/theme";

export function Screen({
  children,
  scrollProps,
}: {
  children: ReactNode;
  scrollProps?: ScrollViewProps;
}) {
  const { c } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.obsidian }}
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  );
}
