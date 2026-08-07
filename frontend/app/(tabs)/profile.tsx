import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { initials } from "@/src/utils";
import { ensureLocationPermission } from "@/src/permissions";
import PostCard from "@/src/components/PostCard";

export default function Profile() {
  const router = useRouter();
  const { user, logout, updateProfile, refresh } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const granted = await ensureLocationPermission();
      if (!granted) { setLocLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const first = geo[0];
      if (first) {
        setLocation([first.city || first.subregion, first.region, first.country].filter(Boolean).join(", "));
      }
    } catch {} finally {
      setLocLoading(false);
    }
  };

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const p = await api.listPosts(undefined, user.id);
      setPosts(p);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setName(user?.name || ""); setBio(user?.bio || ""); setLocation(user?.location || ""); }, [user]);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
    });
    if (!res.canceled && res.assets[0].base64) {
      const dataUrl = `data:image/jpeg;base64,${res.assets[0].base64}`;
      await updateProfile({ avatar: dataUrl });
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, bio, location });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const onLogout = () => {
    const doLogout = async () => { await logout(); router.replace("/(auth)/welcome"); };
    if (Platform.OS === "web") { doLogout(); return; }
    Alert.alert("Log out?", "You can log in again anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: doLogout },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.hero}>
          <Pressable testID="pick-avatar" onPress={pickAvatar}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avPh]}><Text style={styles.avTxt}>{initials(user.name)}</Text></View>
            )}
            <View style={styles.editAvatar}><Ionicons name="camera" size={14} color="#fff" /></View>
          </Pressable>

          {editing ? (
            <View style={{ width: "100%", gap: spacing.sm, marginTop: spacing.md }}>
              <TextInput style={styles.field} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.muted} testID="edit-name" />
              <TextInput style={[styles.field, { minHeight: 60 }]} value={bio} onChangeText={setBio} placeholder="Bio (a line about you & your farm)" placeholderTextColor={colors.muted} multiline testID="edit-bio" />
              <View style={styles.locRow}>
                <TextInput style={[styles.field, { flex: 1 }]} value={location} onChangeText={setLocation} placeholder="Village, City, State" placeholderTextColor={colors.muted} testID="edit-location" />
                <Pressable testID="detect-location" style={styles.locBtn} onPress={detectLocation} disabled={locLoading}>
                  {locLoading ? <ActivityIndicator size="small" color={colors.brand} /> : <Ionicons name="navigate" size={18} color={colors.brand} />}
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                <Pressable style={styles.ghostBtn} onPress={() => setEditing(false)}><Text style={styles.ghostBtnText}>Cancel</Text></Pressable>
                <Pressable style={styles.primaryBtn} onPress={saveEdit} disabled={saving} testID="save-profile">
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md }}>
                <Text style={styles.name}>{user.name}</Text>
                {user.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.brand} /> : null}
              </View>
              <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{user.role}</Text></View>
              {user.location ? <Text style={styles.meta}><Ionicons name="location-outline" size={12} /> {user.location}</Text> : null}
              {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

              <View style={styles.stats}>
                <View style={styles.statCell}><Text style={styles.statN}>{posts.length}</Text><Text style={styles.statL}>Posts</Text></View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}><Text style={styles.statN}>{user.followers}</Text><Text style={styles.statL}>Followers</Text></View>
              </View>

              {user.subscribed ? (
                <View style={styles.plusCard} testID="plus-active-card">
                  <Ionicons name="sparkles" size={18} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plusTitle}>Krishiva Plus active</Text>
                    <Text style={styles.plusSub}>
                      {user.subscription_expires_at ? `Valid till ${new Date(user.subscription_expires_at).toLocaleDateString()}` : "Full member access"}
                    </Text>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.plusCta} onPress={() => router.push("/subscribe")} testID="profile-subscribe">
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plusCtaTitle}>Join Krishiva Plus</Text>
                    <Text style={styles.plusCtaSub}>Unlock posting, follow & chat · from ₹99/mo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </Pressable>
              )}

              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, width: "100%" }}>
                <Pressable testID="edit-profile" style={styles.primaryBtn} onPress={() => setEditing(true)}>
                  <Ionicons name="pencil" size={14} color="#fff" />
                  <Text style={styles.primaryBtnText}>Edit profile</Text>
                </Pressable>
                <Pressable testID="logout-btn" style={styles.logoutBtn} onPress={onLogout}>
                  <Ionicons name="log-out-outline" size={18} color={colors.error} />
                  <Text style={styles.logoutTxt}>Log out</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My posts</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyTxt}>You haven't posted yet. Share your first tip or video!</Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push("/create-post")}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Create post</Text>
            </Pressable>
          </View>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} onChanged={() => { load(); refresh(); }} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { alignItems: "center", padding: spacing.xl, backgroundColor: colors.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.brandTertiary },
  avPh: { alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.brand, fontSize: 32, fontWeight: "700" },
  editAvatar: { position: "absolute", right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  name: { fontSize: font.size.xxl, fontWeight: "700", color: colors.onSurface },
  roleBadge: { backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, marginTop: spacing.xs },
  roleBadgeText: { color: colors.brand, fontWeight: "600", textTransform: "capitalize", fontSize: font.size.xs },
  meta: { color: colors.onSurfaceTertiary, marginTop: 4, fontSize: font.size.base },
  bio: { color: colors.onSurfaceSecondary, marginTop: spacing.sm, textAlign: "center", lineHeight: 20, fontSize: font.size.base },
  stats: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.md, width: "100%", justifyContent: "space-around" },
  statCell: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  statN: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  statL: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  primaryBtn: { flex: 1, backgroundColor: colors.brand, borderRadius: radius.pill, height: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  ghostBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, height: 44, alignItems: "center", justifyContent: "center" },
  ghostBtnText: { color: colors.onSurface, fontWeight: "600" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  logoutBtn: { flex: 1, flexDirection: "row", gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  logoutTxt: { color: colors.error, fontWeight: "600" },
  plusCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md, width: "100%", marginTop: spacing.md, borderWidth: 1, borderColor: "#D8E8DA" },
  plusTitle: { fontWeight: "700", color: colors.brand, fontSize: font.size.base },
  plusSub: { fontSize: font.size.xs, color: colors.onSurfaceTertiary, marginTop: 2 },
  plusCta: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.brand, borderRadius: radius.md, padding: spacing.md, width: "100%", marginTop: spacing.md },
  plusCtaTitle: { fontWeight: "700", color: "#fff", fontSize: font.size.base },
  plusCtaSub: { fontSize: font.size.xs, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: font.size.base, color: colors.onSurface },
  locRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  locBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  emptyPosts: { alignItems: "center", padding: spacing.xl, gap: spacing.md },
  emptyTxt: { color: colors.onSurfaceTertiary, textAlign: "center", fontSize: font.size.base },
});
