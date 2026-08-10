import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const p = await api.getProduct(id!);
      setProduct(p);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  if (!product) return <View style={styles.center}><Text style={styles.error}>Product not found.</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Product Details</Text>
        <Pressable hitSlop={10} onPress={() => router.push("/market/cart")}><Ionicons name="cart-outline" size={26} color={colors.onSurface} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
        <View style={styles.content}>
          <View style={styles.rowBetween}>
            <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
          </View>
          <Text style={styles.price}>{product.price}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingText}>{product.rating} ({product.reviews} reviews)</Text>
            <View style={styles.dot} />
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              {product.seller.image ? (
                <Image source={{ uri: product.seller.image }} style={styles.sellerAvatar} />
              ) : (
                <View style={[styles.sellerAvatar, { backgroundColor: colors.surfaceTertiary }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{product.seller.name}</Text>
                <Text style={styles.sellerLocation}><Ionicons name="location-outline" size={12} /> {product.seller.location}</Text>
              </View>
              <View style={styles.sellerRating}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.sellerRatingText}>{product.seller.rating}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.buyBtn} onPress={() => {
          // Mock adding to cart
          router.push("/market/cart");
        }}>
          <Text style={styles.buyBtnText}>Add to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: colors.muted, fontSize: font.size.base },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceTertiary },
  content: { padding: spacing.lg },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  title: { flex: 1, fontSize: font.size.xl, fontWeight: "700", color: colors.onSurface },
  price: { fontSize: font.size.xxl, fontWeight: "700", color: colors.brand, marginTop: spacing.xs },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  ratingText: { fontSize: font.size.sm, color: colors.onSurfaceSecondary, fontWeight: "500" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },
  categoryText: { fontSize: font.size.sm, color: colors.onSurfaceTertiary },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.md },
  description: { fontSize: font.size.base, color: colors.onSurfaceSecondary, lineHeight: 22 },
  sellerCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24 },
  sellerName: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurface },
  sellerLocation: { fontSize: font.size.xs, color: colors.onSurfaceTertiary, marginTop: 4 },
  sellerRating: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  sellerRatingText: { fontSize: font.size.xs, fontWeight: "600", color: colors.onSurface },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  buyBtn: { backgroundColor: colors.brand, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" },
  buyBtnText: { color: "#fff", fontSize: font.size.lg, fontWeight: "700" }
});
