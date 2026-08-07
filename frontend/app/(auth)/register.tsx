import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { colors, spacing, font, radius } from "@/src/theme";
import { useAuth } from "@/src/auth";

const ROLES = [
  { id: "farmer", label: "Farmer", icon: "leaf", desc: "I grow or want to grow organic" },
  { id: "buyer", label: "Learner", icon: "school", desc: "I want to learn and support" },
  { id: "expert", label: "Expert", icon: "ribbon", desc: "Agronomist / trainer / consultant" },
] as const;

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer" | "expert">("farmer");
  const [locLoading, setLocLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErr("Location permission denied. You can type it manually.");
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const first = geo[0];
      if (first) {
        const label = [first.city || first.subregion, first.region, first.country].filter(Boolean).join(", ");
        setLocation(label);
      }
    } catch (e: any) {
      setErr("Could not fetch location. Type it manually.");
    } finally {
      setLocLoading(false);
    }
  };

  const submit = async () => {
    setErr(null);
    if (!name.trim()) return setErr("Please enter your name");
    if (!email.trim()) return setErr("Please enter your email");
    if (password.length < 6) return setErr("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role, location: location.trim() });
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable testID="back-btn" style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.h1}>Join Krishiva</Text>
            <Text style={styles.sub}>Tell us a bit about yourself.</Text>
          </View>

          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleWrap}>
            {ROLES.map((r) => {
              const active = role === r.id;
              return (
                <Pressable
                  key={r.id}
                  testID={`role-${r.id}`}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  onPress={() => setRole(r.id)}
                >
                  <View style={[styles.roleIcon, active && { backgroundColor: colors.brand }]}>
                    <Ionicons name={r.icon as any} size={20} color={active ? "#fff" : colors.brand} />
                  </View>
                  <Text style={[styles.roleLabel, active && { color: colors.brand }]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <View style={styles.field}>
              <Ionicons name="person-outline" size={20} color={colors.muted} />
              <TextInput testID="reg-name" style={styles.input} placeholder="Full name" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
            </View>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={20} color={colors.muted} />
              <TextInput testID="reg-email" style={styles.input} placeholder="Email address" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            </View>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
              <TextInput testID="reg-password" style={styles.input} placeholder="Password (min 6)" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />
            </View>
            <View style={styles.field}>
              <Ionicons name="location-outline" size={20} color={colors.muted} />
              <TextInput testID="reg-location" style={styles.input} placeholder="Village / City, State" placeholderTextColor={colors.muted} value={location} onChangeText={setLocation} />
              <Pressable testID="detect-location" onPress={detectLocation} disabled={locLoading} hitSlop={10}>
                {locLoading ? <ActivityIndicator size="small" color={colors.brand} /> : <Ionicons name="navigate-circle" size={22} color={colors.brand} />}
              </Pressable>
            </View>
            {err ? <Text style={styles.err} testID="reg-error">{err}</Text> : null}
          </View>

          <Pressable testID="reg-submit" style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account</Text>}
          </Pressable>

          <Pressable testID="go-login" onPress={() => router.replace("/(auth)/login")} style={{ alignItems: "center", padding: spacing.md }}>
            <Text style={{ color: colors.onSurfaceTertiary }}>
              Already have an account? <Text style={{ color: colors.brand, fontWeight: "600" }}>Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  h1: { fontSize: 28, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: spacing.xs },
  label: { marginTop: spacing.xl, marginBottom: spacing.sm, fontSize: font.size.base, fontWeight: "600", color: colors.onSurfaceSecondary },
  roleWrap: { flexDirection: "row", gap: spacing.sm },
  roleCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.border },
  roleCardActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  roleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  roleLabel: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurface },
  roleDesc: { fontSize: font.size.xs, color: colors.onSurfaceTertiary, marginTop: 2 },
  field: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, height: 54 },
  input: { flex: 1, fontSize: font.size.lg, color: colors.onSurface },
  err: { color: colors.error, fontSize: font.size.base, textAlign: "center" },
  btn: { backgroundColor: colors.brand, borderRadius: radius.pill, height: 54, alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  btnText: { color: "#fff", fontSize: font.size.lg, fontWeight: "600" },
});
