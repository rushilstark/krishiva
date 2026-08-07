import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, font, radius, TAGS } from "@/src/theme";
import { api } from "@/src/api";
import { toYouTubeEmbed } from "@/src/utils";

const POST_TAGS = TAGS.filter((t) => t.id !== "all");

export default function CreatePost() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tag, setTag] = useState("procedure");
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed", "Please allow media access");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", quality: 0.6, base64: true,
    });
    if (!res.canceled && res.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const submit = async () => {
    setErr(null);
    if (!caption.trim() && !image && !videoUrl.trim()) return setErr("Add a caption, photo or video");
    if (videoUrl.trim() && !toYouTubeEmbed(videoUrl) && !/^https?:\/\/.+\.(mp4|mov|m4v|webm)/i.test(videoUrl)) {
      return setErr("Please paste a YouTube URL or a direct .mp4/.mov link");
    }
    setPosting(true);
    try {
      await api.createPost({ caption: caption.trim(), image, video_url: videoUrl.trim(), tag });
      router.back();
    } catch (e: any) {
      setErr(e.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable testID="cancel-post" onPress={() => router.back()} style={styles.hBtn}><Text style={styles.cancelTxt}>Cancel</Text></Pressable>
        <Text style={styles.hTitle}>New Post</Text>
        <Pressable testID="submit-post" style={[styles.postBtn, posting && { opacity: 0.6 }]} onPress={submit} disabled={posting}>
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnTxt}>Post</Text>}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {POST_TAGS.map((t) => {
              const active = tag === t.id;
              return (
                <Pressable key={t.id} testID={`tag-${t.id}`} style={[styles.chip, active && styles.chipActive]} onPress={() => setTag(t.id)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            testID="caption-input"
            style={styles.caption}
            placeholder="Share a tip, procedure, story, or question with the community…"
            placeholderTextColor={colors.muted}
            multiline
            value={caption}
            onChangeText={setCaption}
          />

          {image ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: image }} style={styles.preview} contentFit="cover" />
              <Pressable style={styles.removeBtn} onPress={() => setImage("")}><Ionicons name="close" size={16} color="#fff" /></Pressable>
            </View>
          ) : null}

          <View style={styles.attachRow}>
            <Pressable testID="pick-image" style={styles.attachBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color={colors.brand} />
              <Text style={styles.attachTxt}>Photo</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Or add a video link (YouTube / MP4)</Text>
          <View style={styles.linkField}>
            <Ionicons name="videocam-outline" size={20} color={colors.muted} />
            <TextInput
              testID="video-url-input"
              style={{ flex: 1, fontSize: font.size.base, color: colors.onSurface }}
              placeholder="https://youtube.com/watch?v=…"
              placeholderTextColor={colors.muted}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.hint}>Tip: Share YouTube videos of organic procedures, composting, waste management etc.</Text>

          {err ? <Text style={styles.err}>{err}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  hBtn: { minWidth: 70 },
  cancelTxt: { fontSize: font.size.base, color: colors.onSurfaceTertiary },
  hTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },
  postBtn: { backgroundColor: colors.brand, paddingHorizontal: spacing.lg, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", minWidth: 70 },
  postBtnTxt: { color: "#fff", fontWeight: "600" },
  label: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurfaceSecondary },
  chip: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: font.size.base, color: colors.onSurfaceSecondary, fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  caption: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, minHeight: 120, fontSize: font.size.base, color: colors.onSurface, textAlignVertical: "top" },
  previewWrap: { position: "relative", borderRadius: radius.md, overflow: "hidden" },
  preview: { width: "100%", height: 220 },
  removeBtn: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  attachRow: { flexDirection: "row", gap: spacing.md },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill },
  attachTxt: { color: colors.brand, fontWeight: "600" },
  linkField: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, height: 48 },
  hint: { fontSize: font.size.xs, color: colors.muted, lineHeight: 16 },
  err: { color: colors.error, fontSize: font.size.base, textAlign: "center" },
});
