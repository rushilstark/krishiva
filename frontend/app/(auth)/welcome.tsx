import { View, Text, StyleSheet, Pressable, ImageBackground, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, font, radius } from "@/src/theme";

const FEATURES = [
  { icon: "videocam", title: "Learn from real farms", desc: "Watch organic procedures shared by verified farmers across India." },
  { icon: "leaf", title: "Share your knowledge", desc: "Post videos, tips and success stories. Grow the movement." },
  { icon: "sparkles", title: "AI Krishi Sahayak", desc: "Ask about pests, soil, composting — get instant expert advice." },
  { icon: "trash", title: "Waste to wealth", desc: "Awareness on cleanliness, composting & responsible waste management." },
];

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1635756227689-01eda5140530?w=1200&q=80" }}
        style={styles.hero}
      >
        <LinearGradient
          colors={["rgba(26,33,28,0.15)", "rgba(26,33,28,0.35)", "rgba(249,249,247,1)"]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
        <View style={styles.heroContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot}><Ionicons name="leaf" size={20} color="#fff" /></View>
            <Text style={styles.logoText}>Krishiva</Text>
          </View>
          <Text style={styles.tagline}>India's Organic{"\n"}Farming Community</Text>
          <Text style={styles.subtag}>Where farmers, learners & the earth grow together.</Text>
        </View>
      </ImageBackground>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow} testID={`feature-${f.icon}`}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={22} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.cta}>
        <Pressable testID="welcome-register-btn" style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.primaryBtnText}>Create your account</Text>
        </Pressable>
        <Pressable testID="welcome-login-btn" style={styles.secondaryBtn} onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 320, justifyContent: "flex-end" },
  heroContent: { padding: spacing.xl, paddingBottom: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  logoDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  tagline: { color: "#fff", fontSize: 32, fontWeight: "700", lineHeight: 38 },
  subtag: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: spacing.sm },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.md },
  featureIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: font.size.lg, fontWeight: "600", color: colors.onSurface, marginBottom: 2 },
  featureDesc: { fontSize: font.size.base, color: colors.onSurfaceTertiary, lineHeight: 20 },
  cta: { padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  primaryBtn: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: font.size.lg, fontWeight: "600" },
  secondaryBtn: { alignItems: "center", paddingVertical: 6 },
  secondaryBtnText: { color: colors.brand, fontSize: font.size.base, fontWeight: "500" },
});
