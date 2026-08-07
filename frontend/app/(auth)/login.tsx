import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, font, radius } from "@/src/theme";
import { useAuth } from "@/src/auth";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!email.trim() || !password) return setErr("Please enter email and password");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable testID="back-btn" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.h1}>Welcome back</Text>
            <Text style={styles.sub}>Log in to continue with Krishiva.</Text>
          </View>

          <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={20} color={colors.muted} />
              <TextInput
                testID="login-email"
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
              <TextInput
                testID="login-password"
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={10}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
              </Pressable>
            </View>
            {err ? <Text style={styles.err} testID="login-error">{err}</Text> : null}
          </View>

          <Pressable testID="login-submit" style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log in</Text>}
          </Pressable>

          <Pressable
            testID="go-forgot-password"
            onPress={() => router.push("/(auth)/forgot-password")}
            style={{ alignItems: "center", paddingVertical: spacing.sm, marginTop: spacing.xs }}
          >
            <Text style={{ color: colors.brand, fontWeight: "600" }}>Forgot password?</Text>
          </Pressable>

          <Pressable testID="go-register" onPress={() => router.replace("/(auth)/register")} style={{ alignItems: "center", padding: spacing.md }}>
            <Text style={{ color: colors.onSurfaceTertiary }}>
              New to Krishiva? <Text style={{ color: colors.brand, fontWeight: "600" }}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl, flexGrow: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  h1: { fontSize: 30, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: spacing.xs },
  field: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, height: 54 },
  input: { flex: 1, fontSize: font.size.lg, color: colors.onSurface },
  err: { color: colors.error, fontSize: font.size.base, textAlign: "center" },
  btn: { backgroundColor: colors.brand, borderRadius: radius.pill, height: 54, alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  btnText: { color: "#fff", fontSize: font.size.lg, fontWeight: "600" },
});
