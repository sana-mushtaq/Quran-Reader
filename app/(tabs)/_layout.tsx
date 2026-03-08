import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, View, Text } from "react-native";
import React from "react";
import { useTheme } from "@/lib/theme-context";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Today</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="surahs">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Surahs</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bookmarks">
        <Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} />
        <Label>Saved</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isDark, theme, toggleTheme } = useTheme();
  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border, borderTopWidth: isWeb ? 1 : 0 }, isWeb && { height: 84 }]}>
      <View style={styles.tabItems}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused
            ? (isDark ? theme.tabIconSelected : "#40433f")
            : (isDark ? theme.tabIconDefault : "#706c67");

          let iconName: any = "sunny-outline";
          if (route.name === "surahs") iconName = "book-outline";
          if (route.name === "bookmarks") iconName = "bookmark-outline";

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tabItem}
            >
              <Ionicons name={iconName} size={24} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{options.title || route.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={toggleTheme} style={styles.themeToggle} hitSlop={8}>
        <View style={[styles.themeToggleInner, { backgroundColor: isDark ? "#3a3a3a" : "#d4c4b8" }]}>
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={18}
            color={isDark ? "#f0c040" : "#5a4e44"}
          />
        </View>
      </Pressable>
    </View>
  );
}

function ClassicTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="surahs" options={{ title: "Surahs" }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Saved" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabItems: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  themeToggle: {
    paddingRight: 16,
  },
  themeToggleInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
