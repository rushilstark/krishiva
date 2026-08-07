import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { WebView } from "react-native-webview";
import { colors, spacing, font, radius } from "@/src/theme";
import { timeAgo, initials, toYouTubeEmbed, isDirectVideoUrl } from "@/src/utils";
import { api } from "@/src/api";
import * as Haptics from "expo-haptics";

const W = Dimensions.get("window").width;

export default function PostCard({ post, onChanged, onPressComments }: { post: any; onChanged?: (p: any) => void; onPressComments?: () => void }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments_count);

  const toggleLike = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // optimistic
      setLiked(!liked);
      setLikes((n: number) => n + (liked ? -1 : 1));
      const updated = await api.toggleLike(post.id);
      setLiked(updated.liked_by_me);
      setLikes(updated.likes);
      onChanged?.(updated);
    } catch {
      setLiked(liked);
      setLikes(likes);
    }
  };

  const yt = post.video_url ? toYouTubeEmbed(post.video_url) : null;
  const direct = post.video_url && !yt && isDirectVideoUrl(post.video_url);

  return (
    <View style={styles.card} testID={`post-${post.id}`}>
      <Pressable style={styles.header} onPress={() => router.push(`/user/${post.user_id}`)}>
        {post.user_avatar ? (
          <Image source={{ uri: post.user_avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{initials(post.user_name)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.name}>{post.user_name}</Text>
            {post.user_verified ? <Ionicons name="checkmark-circle" size={14} color={colors.brand} /> : null}
          </View>
          <Text style={styles.meta}>{post.user_role} · {timeAgo(post.created_at)}</Text>
        </View>
        <View style={styles.tag}><Text style={styles.tagText}>{post.tag}</Text></View>
      </Pressable>

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {yt ? (
        <View style={styles.media}>
          <WebView
            source={{ uri: yt }}
            style={{ flex: 1 }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction
            javaScriptEnabled
          />
        </View>
      ) : direct ? (
        <View style={styles.media}>
          <WebView
            source={{ html: `<html><body style="margin:0;background:#000"><video controls playsinline style="width:100%;height:100%;object-fit:contain"><source src="${post.video_url}"/></video></body></html>` }}
            style={{ flex: 1 }}
            allowsInlineMediaPlayback
          />
        </View>
      ) : post.image ? (
        <Image source={{ uri: post.image }} style={styles.image} contentFit="cover" />
      ) : null}

      <View style={styles.actions}>
        <Pressable testID={`like-${post.id}`} style={styles.actionBtn} onPress={toggleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? colors.error : colors.onSurface} />
          <Text style={styles.actionCount}>{likes}</Text>
        </Pressable>
        <Pressable testID={`comment-${post.id}`} style={styles.actionBtn} onPress={onPressComments || (() => router.push(`/post/${post.id}`))}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.onSurface} />
          <Text style={styles.actionCount}>{comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable testID={`share-${post.id}`} style={styles.actionBtn}>
          <Ionicons name="share-outline" size={20} color={colors.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, marginHorizontal: spacing.lg, marginBottom: spacing.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTertiary },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brand, fontWeight: "700", fontSize: font.size.base },
  name: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurface },
  meta: { fontSize: font.size.xs, color: colors.muted, marginTop: 1, textTransform: "capitalize" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.brandTertiary },
  tagText: { fontSize: font.size.xs, color: colors.brand, fontWeight: "600", textTransform: "capitalize" },
  caption: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, fontSize: font.size.base, color: colors.onSurface, lineHeight: 20 },
  image: { width: "100%", height: W * 0.85, backgroundColor: colors.surfaceTertiary },
  media: { width: "100%", height: W * 0.6, backgroundColor: "#000" },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.lg, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: font.size.base, color: colors.onSurface, fontWeight: "500" },
});
