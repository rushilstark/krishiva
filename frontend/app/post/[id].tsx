import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { initials, timeAgo } from "@/src/utils";
import PostCard from "@/src/components/PostCard";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.listPosts(), api.listComments(id!)]);
      setPost(p.find((x: any) => x.id === id));
      setComments(c);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const c = await api.addComment(id!, text.trim());
      setComments((cs) => [...cs, c]);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable testID="close-detail" onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-down" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Post</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(i) => i.id}
            ListHeaderComponent={post ? <PostCard post={post} onChanged={setPost} /> : null}
            renderItem={({ item }) => (
              <View style={styles.comment}>
                {item.user_avatar ? <Image source={{ uri: item.user_avatar }} style={styles.cAv} /> :
                  <View style={[styles.cAv, styles.avPh]}><Text style={styles.avTxt}>{initials(item.user_name)}</Text></View>}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={styles.cName}>{item.user_name}</Text>
                    <Text style={styles.cTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={styles.cText}>{item.text}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Be the first to comment</Text>}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            testID="comment-input"
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable testID="send-comment" onPress={send} style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]} disabled={!text.trim() || sending}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  comment: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, marginHorizontal: spacing.md },
  cAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary },
  avPh: { alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.brand, fontWeight: "700", fontSize: 12 },
  cName: { fontWeight: "600", fontSize: font.size.base, color: colors.onSurface },
  cTime: { fontSize: font.size.xs, color: colors.muted },
  cText: { fontSize: font.size.base, color: colors.onSurfaceSecondary, marginTop: 2, lineHeight: 20 },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl, fontSize: font.size.base },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: font.size.base, color: colors.onSurface, minHeight: 42, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
