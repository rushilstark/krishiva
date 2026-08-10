import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.listOrders();
      setOrders(res);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <Text style={styles.orderDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.orderBody}>
        <Image source={{ uri: item.image }} style={styles.orderImage} contentFit="cover" />
        <View style={styles.orderInfo}>
          <Text style={styles.orderItems} numberOfLines={2}>{item.items}</Text>
          <Text style={styles.orderTotal}>{item.total}</Text>
        </View>
      </View>
      <View style={styles.orderFooter}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Pressable style={styles.trackBtn}>
          <Text style={styles.trackBtnText}>Track Order</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={60} color={colors.muted} />
              <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  orderCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  orderId: { fontSize: font.size.sm, fontWeight: "600", color: colors.onSurface },
  orderDate: { fontSize: font.size.sm, color: colors.onSurfaceSecondary },
  orderBody: { flexDirection: "row", padding: spacing.md, gap: spacing.md },
  orderImage: { width: 60, height: 60, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  orderInfo: { flex: 1, justifyContent: "center" },
  orderItems: { fontSize: font.size.base, color: colors.onSurface, fontWeight: "500", marginBottom: 4 },
  orderTotal: { fontSize: font.size.sm, color: colors.brand, fontWeight: "700" },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  statusBadge: { backgroundColor: colors.surfaceTertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  statusText: { fontSize: font.size.xs, fontWeight: "600", color: colors.onSurface, textTransform: "uppercase" },
  trackBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.brand },
  trackBtnText: { color: colors.brand, fontSize: font.size.sm, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, marginTop: spacing.xxxl },
  emptyText: { color: colors.muted, fontSize: font.size.base },
});
