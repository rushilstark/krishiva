import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius, TAGS } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import PostCard from "@/src/components/PostCard";

export default function Feed() {
  const router = useRouter();
  const { user } = useAuth();
  const [tag, setTag] = useState("all");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (t: string = tag) => {
    try {
      const data = await api.listPosts(t);
      setPosts(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tag]);

  useEffect(() => { load(tag); }, [tag, load]);

  const onRefresh = () => { setRefreshing(true); load(tag); };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Krishiva</Text>
          <Text style={styles.hi}>Namaste, {user?.name?.split(" ")[0] || "friend"} 🌱</Text>
        </View>
        <Pressable testID="header-notif" style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center" }}>
          {TAGS.map((t) => {
            const active = tag === t.id;
            return (
              <Pressable key={t.id} testID={`chip-${t.id}`} style={[styles.chip, active && styles.chipActive]} onPress={() => setTag(t.id)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
      ) : posts.length === 0 ? (
        <ScrollView contentContainerStyle={styles.empty} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.emptyIcon}><Ionicons name="leaf-outline" size={48} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyDesc}>Be the first to share a farming video, tip or story with the community.</Text>
          <Pressable testID="empty-create" style={styles.emptyBtn} onPress={() => router.push("/create-post")}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyBtnText}>Create your first post</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <FlatList
          testID="feed-list"
          data={posts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <PostCard post={item} onChanged={(u) => setPosts((ps) => ps.map((p) => p.id === u.id ? { ...p, ...u } : p))} />}
          ListHeaderComponent={<View style={{ height: spacing.sm }} />}
          ListFooterComponent={<View style={{ height: spacing.xxl }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable testID="fab-create" style={styles.fab} onPress={() => router.push("/create-post")}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  brand: { fontSize: 24, fontWeight: "700", color: colors.brand },
  hi: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: 2 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  chipRow: { height: 56, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  chip: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: font.size.base, color: colors.onSurfaceSecondary, fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: font.size.xl, fontWeight: "700", color: colors.onSurface },
  emptyDesc: { fontSize: font.size.base, color: colors.onSurfaceTertiary, textAlign: "center", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", gap: spacing.xs, backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: font.size.base },
  fab: { position: "absolute", right: spacing.lg, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
