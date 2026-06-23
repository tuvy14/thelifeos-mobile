import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, fonts } from "@/lib/theme";
import TopBar from "@/components/top-bar";

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
        sceneStyle: { backgroundColor: c.obsidian },
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.inkFaint,
        tabBarStyle: { backgroundColor: c.obsidian, borderTopColor: c.line },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.bodySemibold },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-in",
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wins"
        options={{
          title: "Wins",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
