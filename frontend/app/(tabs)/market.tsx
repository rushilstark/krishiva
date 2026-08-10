import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";

export default function MarketplaceScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(),
        api.listProducts(selectedCategory || undefined)
      ]);
      setCategories([{ id: 'all', name: 'All', icon: 'apps' }, ...cats]);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => { load(); }, [load]);

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const renderProduct = ({ item }: { item: any }) => (
    <Pressable style={styles.productCard} onPress={() => router.push(`/market/product/${item.id}`)}>
      <Image source={{ uri: item.image }} style={styles.productImage} contentFit="cover" />
      <View style={styles.productInfo}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        </View>
        <Text style={styles.productPrice}>{item.price}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.ratingText}>{item.rating} ({item.reviews})</Text>
        </View>
        <View style={styles.tag}><Text style={styles.tagText}>{item.tag}</Text></View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <View style={styles.headerRight}>
          <Pressable testID="header-cart" style={styles.iconBtn} onPress={() => router.push("/market/cart")}>
            <Ionicons name="cart-outline" size={22} color={colors.onSurface} />
          </Pressable>
          <Pressable testID="header-orders" style={styles.iconBtn} onPress={() => router.push("/market/orders")}>
            <Ionicons name="receipt-outline" size={22} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.search}
          placeholder="Search tractors, seeds, fertilizers..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((c) => {
            const isSelected = (c.id === 'all' && !selectedCategory) || c.id === selectedCategory;
            return (
              <Pressable
                key={c.id}
                style={[styles.catPill, isSelected && styles.catPillSelected]}
                onPress={() => setSelectedCategory(c.id === 'all' ? null : c.id)}
              >
                {c.icon ? <Ionicons name={c.icon as any} size={16} color={isSelected ? '#fff' : colors.onSurfaceSecondary} /> : null}
                <Text style={[styles.catText, isSelected && styles.catTextSelected]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="basket-outline" size={60} color={colors.muted} />
          <Text style={styles.emptyText}>No products found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderProduct}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: 28, fontWeight: "700", color: colors.onSurface },
  headerRight: { flexDirection: "row", gap: spacing.sm },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, height: 48, borderWidth: 1, borderColor: colors.border },
  search: { flex: 1, fontSize: font.size.base, color: colors.onSurface },
  categoryScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  catPillSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  catText: { fontSize: font.size.sm, fontWeight: "600", color: colors.onSurfaceSecondary },
  catTextSelected: { color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: font.size.base },
  grid: { padding: spacing.md },
  gridRow: { gap: spacing.md },
  productCard: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  productImage: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceTertiary },
  productInfo: { padding: spacing.sm },
  productName: { fontSize: font.size.sm, fontWeight: "600", color: colors.onSurface, marginBottom: 4 },
  productPrice: { fontSize: font.size.base, fontWeight: "700", color: colors.brand, marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  ratingText: { fontSize: 12, color: colors.onSurfaceSecondary },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.surfaceTertiary },
  tagText: { fontSize: 10, color: colors.onSurfaceSecondary, fontWeight: "600", textTransform: "capitalize" }
});
