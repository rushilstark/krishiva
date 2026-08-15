import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, StatusBar, View, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider } from "@/src/auth";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      setTimeout(() => setShowSplash(false), 2000);
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: "#377C2B" }}>
        <StatusBar hidden />
        <Image 
          source={require("@/assets/images/custom-splash.png")} 
          style={{ width: "100%", height: "100%", resizeMode: "cover" }} 
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#F9F9F7" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F9F9F7" } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="create-post" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="subscribe" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="post/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="chat/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="user/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="article/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
