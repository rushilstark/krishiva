import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { timeAgo, initials } from "@/src/utils";

export default function Chats() {
  const router = useRouter();
  const [convs, setConvs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, u] = await Promise.all([api.listConversations(), api.searchUsers("")]);
      setConvs(c);
      setUsers(u);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = q.trim()
    ? users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Messages</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          testID="chat-search"
          style={styles.search}
          placeholder="Find farmers, experts, learners…"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
      ) : q.trim() ? (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Pressable testID={`user-${item.id}`} style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
              {item.avatar ? <Image source={{ uri: item.avatar }} style={styles.avatar} /> :
                <View style={[styles.avatar, styles.avPh]}><Text style={styles.avTxt}>{initials(item.name)}</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.preview}>{item.role} · {item.location || "India"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
        />
      ) : convs.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={40} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDesc}>Search for a user above to start chatting, or tap on any post author to message them.</Text>
        </View>
      ) : (
        <FlatList
          testID="conv-list"
          data={convs}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <Pressable testID={`conv-${item.id}`} style={styles.row} onPress={() => router.push(`/chat/${item.other_user_id}`)}>
              {item.other_user_avatar ? <Image source={{ uri: item.other_user_avatar }} style={styles.avatar} /> :
                <View style={[styles.avatar, styles.avPh]}><Text style={styles.avTxt}>{initials(item.other_user_name)}</Text></View>}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.name}>{item.other_user_name}</Text>
                  {item.other_user_verified ? <Ionicons name="checkmark-circle" size={14} color={colors.brand} /> : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>{item.last_message}</Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.last_message_at)}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  h1: { fontSize: 28, fontWeight: "700", color: colors.onSurface },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, height: 44, borderWidth: 1, borderColor: colors.border },
  search: { flex: 1, fontSize: font.size.base, color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandTertiary },
  avPh: { alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.brand, fontWeight: "700" },
  name: { fontSize: font.size.lg, fontWeight: "600", color: colors.onSurface },
  preview: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: 2 },
  time: { fontSize: font.size.xs, color: colors.muted },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl },
  emptyBox: { alignItems: "center", justifyContent: "center", padding: spacing.xl, marginTop: spacing.xxl, gap: spacing.md },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: font.size.xl, fontWeight: "700", color: colors.onSurface },
  emptyDesc: { fontSize: font.size.base, color: colors.onSurfaceTertiary, textAlign: "center", lineHeight: 20 },
});
