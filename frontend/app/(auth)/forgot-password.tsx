import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, font, radius } from "@/src/theme";
import { api, setToken } from "@/src/api";
import { useAuth } from "@/src/auth";

type Step = "email" | "reset";

export default function ForgotPassword() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const requestOtp = async () => {
    setErr(null); setInfo(null); setDevOtp(null);
    if (!identifier.trim()) return setErr("Please enter your email or mobile number");
    setLoading(true);
    try {
      const res = await api.forgotPassword(identifier.trim());
      if (res?.otp) {
        setDevOtp(res.otp);
        setInfo("OTP generated. In production this would be emailed/SMSed. Use the code shown below to reset.");
      } else {
        setInfo("If this email is registered, an OTP has been sent.");
      }
      setStep("reset");
    } catch (e: any) {
      setErr(e.message || "Could not request OTP");
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setErr(null); setInfo(null);
    if (!otp.trim() || otp.trim().length !== 6) return setErr("Enter the 6-digit OTP");
    if (newPw.length < 6) return setErr("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await api.resetPassword(identifier.trim(), otp.trim(), newPw);
      await setToken(res.access_token);
      await refresh();
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable testID="fp-back-btn" style={styles.back} onPress={() => (step === "reset" ? setStep("email") : router.back())}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.h1}>{step === "email" ? "Forgot password?" : "Reset password"}</Text>
            <Text style={styles.sub}>
              {step === "email"
                ? "Enter your email or mobile number. We'll generate a 6-digit code."
                : `Enter the 6-digit code for ${identifier} and choose a new password.`}
            </Text>
          </View>

          {step === "email" ? (
            <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
              <View style={styles.field}>
                <Ionicons name="person-outline" size={20} color={colors.muted} />
                <TextInput
                  testID="fp-email"
                  style={styles.input}
                  placeholder="Email or mobile number"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>
              {err ? <Text style={styles.err} testID="fp-error">{err}</Text> : null}
              <Pressable testID="fp-request-otp" style={[styles.btn, loading && { opacity: 0.7 }]} onPress={requestOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
              </Pressable>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
              {devOtp ? (
                <View testID="fp-dev-otp-banner" style={styles.devBanner}>
                  <Ionicons name="information-circle" size={18} color={colors.info} />
                  <Text style={styles.devBannerText}>
                    Dev OTP: <Text style={{ fontWeight: "700" }}>{devOtp}</Text> (in production this would be sent via email/SMS)
                  </Text>
                </View>
              ) : null}
              <View style={styles.field}>
                <Ionicons name="key-outline" size={20} color={colors.muted} />
                <TextInput
                  testID="fp-otp"
                  style={styles.input}
                  placeholder="6-digit OTP"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
              <View style={styles.field}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
                <TextInput
                  testID="fp-new-password"
                  style={styles.input}
                  placeholder="New password (min 6 chars)"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPw}
                  value={newPw}
                  onChangeText={setNewPw}
                />
                <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={10}>
                  <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              </View>
              {info && !devOtp ? <Text style={styles.info} testID="fp-info">{info}</Text> : null}
              {err ? <Text style={styles.err} testID="fp-error">{err}</Text> : null}
              <Pressable testID="fp-reset-submit" style={[styles.btn, loading && { opacity: 0.7 }]} onPress={doReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset password</Text>}
              </Pressable>
              <Pressable testID="fp-resend" onPress={requestOtp} style={{ alignItems: "center", padding: spacing.sm }}>
                <Text style={{ color: colors.brand, fontWeight: "600" }}>Resend OTP</Text>
              </Pressable>
            </View>
          )}

          <Pressable testID="fp-back-to-login" onPress={() => router.replace("/(auth)/login")} style={{ alignItems: "center", padding: spacing.md, marginTop: spacing.md }}>
            <Text style={{ color: colors.onSurfaceTertiary }}>
              Remember it? <Text style={{ color: colors.brand, fontWeight: "600" }}>Back to log in</Text>
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
  sub: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: spacing.xs, lineHeight: 20 },
  field: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, height: 54 },
  input: { flex: 1, fontSize: font.size.lg, color: colors.onSurface },
  err: { color: colors.error, fontSize: font.size.base, textAlign: "center" },
  info: { color: colors.onSurfaceTertiary, fontSize: font.size.base, textAlign: "center" },
  btn: { backgroundColor: colors.brand, borderRadius: radius.pill, height: 54, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  btnText: { color: "#fff", fontSize: font.size.lg, fontWeight: "600" },
  devBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  devBannerText: { flex: 1, color: colors.onBrandTertiary, fontSize: font.size.base },
});
