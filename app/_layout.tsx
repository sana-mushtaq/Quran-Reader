import { Stack } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuranProvider } from "@/lib/quran-context";
import SplashScreen from "@/components/SplashScreen";

ExpoSplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QuranProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : null}
        </GestureHandlerRootView>
      </QuranProvider>
    </ErrorBoundary>
  );
}
