import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { initials } from "@/src/utils";
import PostCard from "@/src/components/PostCard";

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [u, setU] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.getUser(id!), api.listPosts(undefined, id!)])
      .then(([user, ps]) => { setU(user); setPosts(ps); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const onFollow = async () => {
    setFollowBusy(true);
    try {
      const updated = await api.toggleFollow(u.id);
      setU(updated);
    } catch (e: any) {
      if (e.message === "subscription_required") router.push("/subscribe");
    } finally {
      setFollowBusy(false);
    }
  };

  const onMessage = () => {
    router.push(`/chat/${u.id}`);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  if (!u) return <View style={styles.center}><Text>User not found</Text></View>;

  const isMe = me?.id === u.id;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.topTitle}>Profile</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.hero}>
          {u.avatar ? <Image source={{ uri: u.avatar }} style={styles.avatar} /> :
            <View style={[styles.avatar, styles.avPh]}><Text style={styles.avTxt}>{initials(u.name)}</Text></View>}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md }}>
            <Text style={styles.name}>{u.name}</Text>
            {u.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.brand} /> : null}
          </View>
          <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{u.role}</Text></View>
          {u.location ? <Text style={styles.meta}><Ionicons name="location-outline" size={12} /> {u.location}</Text> : null}
          {u.bio ? <Text style={styles.bio}>{u.bio}</Text> : null}

          <View style={styles.stats}>
            <View style={styles.statCell}><Text style={styles.statN}>{u.posts_count}</Text><Text style={styles.statL}>Posts</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}><Text style={styles.statN}>{u.followers}</Text><Text style={styles.statL}>Followers</Text></View>
          </View>

          {!isMe ? (
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, width: "100%" }}>
              <Pressable testID="msg-user" style={styles.primaryBtn} onPress={onMessage}>
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Message</Text>
              </Pressable>
              <Pressable
                testID="follow-user"
                style={[styles.ghostBtn, u.is_following && styles.followingBtn, followBusy && { opacity: 0.6 }]}
                onPress={onFollow}
                disabled={followBusy}
              >
                <Ionicons name={u.is_following ? "checkmark" : "person-add-outline"} size={16} color={u.is_following ? colors.brand : colors.onSurface} />
                <Text style={[styles.ghostBtnText, u.is_following && { color: colors.brand }]}>{u.is_following ? "Following" : "Follow"}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Posts</Text>
        {posts.length === 0 ? (
          <Text style={styles.empty}>No posts yet</Text>
        ) : posts.map((p) => <PostCard key={p.id} post={p} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  hero: { alignItems: "center", padding: spacing.xl, backgroundColor: colors.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.brandTertiary },
  avPh: { alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.brand, fontSize: 30, fontWeight: "700" },
  name: { fontSize: font.size.xxl, fontWeight: "700", color: colors.onSurface },
  roleBadge: { backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.xs },
  roleBadgeText: { color: colors.brand, fontWeight: "600", textTransform: "capitalize", fontSize: font.size.xs },
  meta: { color: colors.onSurfaceTertiary, marginTop: 4 },
  bio: { color: colors.onSurfaceSecondary, marginTop: spacing.sm, textAlign: "center", lineHeight: 20 },
  stats: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.md, width: "100%", justifyContent: "space-around" },
  statCell: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  statN: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  statL: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  primaryBtn: { flex: 1, backgroundColor: colors.brand, borderRadius: radius.pill, height: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  ghostBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, height: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  followingBtn: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  ghostBtnText: { color: colors.onSurface, fontWeight: "600" },
  sectionTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
});
