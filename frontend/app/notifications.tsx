import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { timeAgo } from "@/src/utils";

type Notif = {
  id: string;
  actor_name: string;
  actor_avatar?: string;
  type: string;
  text: string;
  post_id?: string;
  read: boolean;
  created_at: string;
};

const TYPE_ICON: Record<string, { name: any; color: string; bg: string }> = {
  like:    { name: "heart",       color: "#E8405A", bg: "#FDE8EB" },
  comment: { name: "chatbubble",  color: colors.brand, bg: colors.brandTertiary },
  follow:  { name: "person-add", color: "#5B8DEF", bg: "#EBF0FD" },
  message: { name: "chatbubbles", color: "#9B59B6", bg: "#F3EBFD" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    // Mark all as read after a short delay (let user see them first)
    const t = setTimeout(() => api.markAllRead().catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleTap = (n: Notif) => {
    api.markOneRead(n.id).catch(() => {});
    if (n.type === "message") {
      router.push("/(tabs)/chats");
    } else if (n.post_id) {
      router.push(`/post/${n.post_id}` as any);
    }
  };

  const renderItem = ({ item }: { item: Notif }) => {
    const icon = TYPE_ICON[item.type] || { name: "notifications", color: colors.onSurface, bg: colors.surfaceSecondary };
    return (
      <Pressable
        style={[styles.row, !item.read && styles.rowUnread]}
        onPress={() => handleTap(item)}
        android_ripple={{ color: colors.border }}
      >
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.text}>{item.text}</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
        {!item.read && <View style={styles.dot} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={() => api.markAllRead().then(() => setNotifications(n => n.map(x => ({ ...x, read: true }))))} hitSlop={10}>
          <Text style={styles.readAll}>Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.brand} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyTxt}>No notifications yet</Text>
              <Text style={styles.emptySub}>When someone follows, likes, or messages you — it'll show up here.</Text>
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
  title: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  readAll: { fontSize: font.size.sm, color: colors.brand, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  rowUnread: { backgroundColor: colors.brandTertiary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  text: { fontSize: font.size.base, color: colors.onSurface, lineHeight: 20 },
  time: { fontSize: font.size.xs, color: colors.muted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, flexShrink: 0 },
  sep: { height: 1, backgroundColor: colors.border },
  empty: { alignItems: "center", padding: spacing.xl, gap: spacing.md, marginTop: spacing.xl },
  emptyTxt: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  emptySub: { fontSize: font.size.base, color: colors.muted, textAlign: "center", lineHeight: 22 },
});
