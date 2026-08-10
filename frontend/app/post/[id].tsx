import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, useRef } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { initials, timeAgo } from "@/src/utils";
import PostCard from "@/src/components/PostCard";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newComment = await api.addComment(id!, text.trim(), replyingTo?.id);
      setComments((cs) => [...cs, newComment]);
      setText("");
      setReplyingTo(null);
      Keyboard.dismiss();
    } finally {
      setSending(false);
    }
  };

  const handleReply = (comment: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const buildTree = () => {
    const map = new Map();
    const roots: any[] = [];
    comments.forEach(c => map.set(c.id, { ...c, children: [] }));
    comments.forEach(c => {
      if (c.reply_to_id && map.has(c.reply_to_id)) {
        map.get(c.reply_to_id).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });
    return roots;
  };

  const renderComment = ({ item, isChild = false }: { item: any, isChild?: boolean }) => (
    <Animated.View layout={Layout.springify()} entering={FadeIn} style={[styles.commentContainer, isChild && styles.childComment]}>
      {item.user_avatar ? <Image source={{ uri: item.user_avatar }} style={styles.cAv} /> :
        <View style={[styles.cAv, styles.avPh]}><Text style={styles.avTxt}>{initials(item.user_name)}</Text></View>}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Text style={styles.cName}>{item.user_name}</Text>
          <Text style={styles.cTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.cText}>{item.text}</Text>
        <Pressable hitSlop={10} onPress={() => handleReply(item)}>
          <Text style={styles.replyText}>Reply</Text>
        </Pressable>
        {item.children?.map((child: any) => (
          <View key={child.id} style={{ marginTop: spacing.md }}>
            {renderComment({ item: child, isChild: true })}
          </View>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable testID="close-detail" onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-down" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Comments</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={buildTree()}
            keyExtractor={(i) => i.id}
            ListHeaderComponent={post ? <PostCard post={post} onChanged={setPost} /> : null}
            renderItem={renderComment}
            ListEmptyComponent={<Text style={styles.empty}>Be the first to comment</Text>}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          />
        )}

        <View style={styles.inputArea}>
          {replyingTo ? (
            <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText}>Replying to <Text style={{ fontWeight: "700" }}>{replyingTo.user_name}</Text></Text>
              <Pressable onPress={() => setReplyingTo(null)} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={colors.onSurfaceTertiary} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={replyingTo ? `Reply to ${replyingTo.user_name}...` : "Add a comment…"}
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              multiline
            />
            <Pressable testID="send-comment" onPress={send} style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]} disabled={!text.trim() || sending}>
              <Ionicons name="arrow-up" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  commentContainer: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  childComment: { paddingHorizontal: 0, paddingVertical: 0 },
  cAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary },
  avPh: { alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.brand, fontWeight: "700", fontSize: 14 },
  cName: { fontWeight: "700", fontSize: font.size.sm, color: colors.onSurface },
  cTime: { fontSize: font.size.xs, color: colors.muted },
  cText: { fontSize: font.size.base, color: colors.onSurface, marginTop: 2, lineHeight: 20 },
  replyText: { fontSize: font.size.xs, color: colors.onSurfaceTertiary, fontWeight: "600", marginTop: spacing.xs, textTransform: "lowercase" },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl, fontSize: font.size.base },
  inputArea: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  replyingToBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surfaceTertiary },
  replyingToText: { fontSize: font.size.xs, color: colors.onSurfaceSecondary },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: spacing.sm, gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 12, fontSize: font.size.base, color: colors.onSurface, minHeight: 46, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginBottom: 2 },
});
