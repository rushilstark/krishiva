import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";

// Mock local state for cart
const MOCK_CART = [
  { id: "p1", name: "Mahindra Tractor 575 DI", price: "₹6,80,000", qty: 1 },
  { id: "p2", name: "Urea Fertilizer 50kg", price: "₹266", qty: 5 },
];

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_CART);

  const total = items.length === 0 ? 0 : items.length * 1000; // Mock calculation

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
      </View>
      <View style={styles.qtyRow}>
        <Pressable style={styles.qtyBtn}><Ionicons name="remove" size={16} /></Pressable>
        <Text style={styles.qtyText}>{item.qty}</Text>
        <Pressable style={styles.qtyBtn}><Ionicons name="add" size={16} /></Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={60} color={colors.muted} />
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Estimate</Text>
            <Text style={styles.totalValue}>₹6,81,330</Text>
          </View>
          <Pressable style={styles.checkoutBtn} onPress={() => {
            // Mock checkout
            setItems([]);
            alert("Order placed successfully!");
            router.replace("/market/orders");
          }}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurface },
  itemPrice: { fontSize: font.size.sm, color: colors.brand, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: font.size.base, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, marginTop: spacing.xxxl },
  emptyText: { color: colors.muted, fontSize: font.size.base },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  totalLabel: { fontSize: font.size.base, color: colors.onSurfaceSecondary },
  totalValue: { fontSize: font.size.xl, fontWeight: "700", color: colors.onSurface },
  checkoutBtn: { backgroundColor: colors.brand, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" },
  checkoutBtnText: { color: "#fff", fontSize: font.size.lg, fontWeight: "700" }
});
