import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { LogBox, StatusBar, View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider } from "@/src/auth";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [showSplash, setShowSplash] = useState(true);

  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSplash) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 15, friction: 5, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true })
      ]).start();
    }
  }, [showSplash, scale, opacity]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      setTimeout(() => setShowSplash(false), 2000);
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  if (showSplash) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#1A4A22", "#2A7036", "#3D9A4A"]} style={StyleSheet.absoluteFill} />
        <StatusBar hidden />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Animated.View style={{ transform: [{ scale }], opacity, alignItems: "center" }}>
            <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10, marginBottom: 30 }}>
              <Ionicons name="leaf" size={74} color="#2A7036" />
            </View>
            <Text style={{ fontSize: 46, fontWeight: "900", color: "#fff", marginBottom: 10, letterSpacing: 1 }}>Krishiva</Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "600", letterSpacing: 0.5 }}>India's Organic Farming Ecosystem</Text>
          </Animated.View>
        </View>
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
