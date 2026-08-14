import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { WebView } from "react-native-webview";
import { useVideoPlayer, VideoView } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, runOnJS } from "react-native-reanimated";
import { colors, spacing, font, tagLabel } from "@/src/theme";
import { timeAgo, initials, toYouTubeEmbed, isDirectVideoUrl } from "@/src/utils";
import { api } from "@/src/api";
import * as Haptics from "expo-haptics";

const W = Dimensions.get("window").width;

export default function PostCard({ post, onChanged, onPressComments }: { post: any; onChanged?: (p: any) => void; onPressComments?: () => void }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments_count || 0);
  const [bookmarked, setBookmarked] = useState(false);

  const heartScale = useSharedValue(0);

  const toggleLike = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLiked((l: boolean) => !l);
      setLikes((n: number) => n + (liked ? -1 : 1));
      const updated = await api.toggleLike(post.id);
      setLiked(updated.liked_by_me);
      setLikes(updated.likes);
      onChanged?.(updated);
    } catch {
      setLiked(liked);
      setLikes(likes);
    }
  }, [liked, likes, post.id, onChanged]);

  const toggleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarked(!bookmarked);
  };

  const onDoubleTap = useCallback(() => {
    heartScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    heartScale.value = withDelay(500, withSpring(0));
    if (!liked) {
      runOnJS(toggleLike)();
    } else {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [liked, toggleLike, heartScale]);

  const doubleTapGesture = Gesture.Tap().numberOfTaps(2).onEnd(onDoubleTap);

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  const yt = post.video_url ? toYouTubeEmbed(post.video_url) : null;
  const direct = post.video_url && !yt && isDirectVideoUrl(post.video_url);
  const player = useVideoPlayer(direct ? post.video_url : null, (p) => { p.loop = false; });

  const renderMedia = () => {
    if (yt) {
      return (
        <View style={styles.media}>
          <WebView source={{ uri: yt }} style={{ flex: 1 }} allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction javaScriptEnabled />
        </View>
      );
    }
    if (direct) {
      return <VideoView player={player} style={styles.media} nativeControls contentFit="contain" />;
    }
    if (post.image) {
      return (
        <GestureDetector gesture={doubleTapGesture}>
          <View>
            <Image source={{ uri: post.image }} style={styles.image} contentFit="cover" />
            <Animated.View style={[StyleSheet.absoluteFill, styles.overlayHeart, animatedHeartStyle]} pointerEvents="none">
              <Ionicons name="heart" size={120} color="rgba(255, 255, 255, 0.9)" />
            </Animated.View>
          </View>
        </GestureDetector>
      );
    }
    return null;
  };

  return (
    <View style={styles.card} testID={`post-${post.id}`}>
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => router.push(`/user/${post.user_id}`)}>
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
              {post.user_verified ? <Ionicons name="checkmark-circle" size={14} color="#1D9BF0" /> : null}
            </View>
            <Text style={styles.meta}>{post.user_role} · {timeAgo(post.created_at)}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.dotsBtn}><Ionicons name="ellipsis-horizontal" size={20} color={colors.onSurface} /></Pressable>
      </View>

      {renderMedia()}

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable testID={`like-${post.id}`} style={styles.actionIcon} onPress={toggleLike}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? colors.error : colors.onSurface} />
          </Pressable>
          <Pressable testID={`comment-${post.id}`} style={styles.actionIcon} onPress={onPressComments || (() => router.push(`/post/${post.id}`))}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.onSurface} style={{ transform: [{ scaleX: -1 }] }} />
          </Pressable>
          <Pressable testID={`share-${post.id}`} style={styles.actionIcon}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
        <Pressable testID={`bookmark-${post.id}`} style={styles.actionIcon} onPress={toggleBookmark}>
          <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.likesText}>{(likes || 0).toLocaleString()} likes</Text>
        {post.caption ? (
          <Text style={styles.caption}>
            <Text style={styles.captionName}>{post.user_name} </Text>
            {post.caption}
          </Text>
        ) : null}
        {comments > 0 ? (
          <Pressable onPress={onPressComments || (() => router.push(`/post/${post.id}`))}>
            <Text style={styles.commentsText}>View all {comments} comments</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, marginBottom: spacing.lg, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceTertiary },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brand, fontWeight: "600", fontSize: font.size.sm },
  name: { fontSize: font.size.sm, fontWeight: "600", color: colors.onSurface },
  meta: { fontSize: font.size.xs, color: colors.onSurfaceTertiary },
  dotsBtn: { padding: spacing.xs },
  image: { width: W, height: W * 1.25, backgroundColor: colors.surfaceTertiary },
  media: { width: W, height: W * 0.75, backgroundColor: "#000" },
  overlayHeart: { alignItems: "center", justifyContent: "center", zIndex: 10 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  actionIcon: { padding: spacing.xs, margin: -spacing.xs },
  footer: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  likesText: { fontWeight: "600", color: colors.onSurface, fontSize: font.size.sm, marginBottom: spacing.xs },
  caption: { fontSize: font.size.sm, color: colors.onSurface, lineHeight: 18, marginBottom: spacing.xs },
  captionName: { fontWeight: "600" },
  commentsText: { fontSize: font.size.sm, color: colors.onSurfaceTertiary },
});
