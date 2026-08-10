import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, font, radius } from "@/src/theme";

export default function Learn() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name="book-outline" size={56} color={colors.brand} />
        </View>
        <Text style={styles.title}>Learn</Text>
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={14} color="#fff" />
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
        <Text style={styles.sub}>
          We're building a curated library of organic farming guides, expert videos, and seasonal tips just for you.
        </Text>
        <Text style={styles.hint}>Stay tuned — it's going to be 🌱</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.brandTertiary,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 32, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.brand, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: font.size.sm, letterSpacing: 0.5 },
  sub: {
    fontSize: font.size.base, color: colors.onSurfaceSecondary,
    textAlign: "center", lineHeight: 24, marginTop: spacing.sm,
  },
  hint: { fontSize: font.size.base, color: colors.muted, marginTop: spacing.xs },
});
