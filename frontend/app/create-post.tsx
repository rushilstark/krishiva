import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, font, radius, TAGS } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { toYouTubeEmbed } from "@/src/utils";
import { ensureCameraPermission, ensureMediaLibraryPermission, uriToBase64 } from "@/src/permissions";

const POST_TAGS = TAGS.filter((t) => t.id !== "all");

export default function CreatePost() {
  const router = useRouter();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState(""); // YouTube / MP4 link
  const [uploadedVideo, setUploadedVideo] = useState<{ url: string; name: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [tag, setTag] = useState("procedure");
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Posting requires Krishiva Plus
  useEffect(() => {
    if (user && !user.subscribed) router.replace("/subscribe");
  }, [user]);

  const handleImageResult = (res: ImagePicker.ImagePickerResult) => {
    if (!res.canceled && res.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    if (!(await ensureMediaLibraryPermission())) return;
    handleImageResult(await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.6, base64: true }));
  };

  const takePhoto = async () => {
    if (!(await ensureCameraPermission())) return;
    handleImageResult(await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.6, base64: true }));
  };

  const uploadVideoAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setErr(null);
    setUploadProgress(0);
    try {
      const b64 = await uriToBase64(asset.uri);
      const mime = asset.mimeType || "video/mp4";
      const { url } = await api.uploadMedia(b64, mime, (p) => setUploadProgress(p));
      const fullUrl = `${api.base}${url}`;
      setUploadedVideo({ url: fullUrl, name: asset.fileName || "farm-video" });
      setVideoUrl("");
    } catch (e: any) {
      setErr(e.message || "Video upload failed. Try a shorter video.");
    } finally {
      setUploadProgress(null);
    }
  };

  const recordVideo = async () => {
    if (!(await ensureCameraPermission())) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos", videoMaxDuration: 60, quality: 0.5,
    });
    if (!res.canceled && res.assets[0]) await uploadVideoAsset(res.assets[0]);
  };

  const pickVideo = async () => {
    if (!(await ensureMediaLibraryPermission())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos", videoMaxDuration: 60, quality: 0.5,
    });
    if (!res.canceled && res.assets[0]) await uploadVideoAsset(res.assets[0]);
  };

  const submit = async () => {
    setErr(null);
    const finalVideo = uploadedVideo?.url || videoUrl.trim();
    if (!caption.trim() && !image && !finalVideo) return setErr("Add a caption, photo or video");
    if (videoUrl.trim() && !toYouTubeEmbed(videoUrl) && !/^https?:\/\/.+\.(mp4|mov|m4v|webm)/i.test(videoUrl)) {
      return setErr("Please paste a YouTube URL or a direct .mp4/.mov link");
    }
    setPosting(true);
    try {
      await api.createPost({ caption: caption.trim(), image, video_url: finalVideo, tag });
      router.back();
    } catch (e: any) {
      if (e.message === "subscription_required") {
        router.replace("/subscribe");
        return;
      }
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
        <Pressable testID="submit-post" style={[styles.postBtn, (posting || uploadProgress !== null) && { opacity: 0.6 }]} onPress={submit} disabled={posting || uploadProgress !== null}>
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
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.emoji} {t.label}</Text>
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

          {uploadedVideo ? (
            <View style={styles.videoChip} testID="uploaded-video">
              <Ionicons name="videocam" size={20} color={colors.brand} />
              <Text style={styles.videoChipTxt} numberOfLines={1}>{uploadedVideo.name} — ready to post</Text>
              <Pressable onPress={() => setUploadedVideo(null)} hitSlop={8}><Ionicons name="close-circle" size={20} color={colors.muted} /></Pressable>
            </View>
          ) : null}

          {uploadProgress !== null ? (
            <View style={styles.uploadWrap} testID="upload-progress">
              <View style={styles.uploadBarBg}><View style={[styles.uploadBar, { width: `${Math.round(uploadProgress * 100)}%` }]} /></View>
              <Text style={styles.uploadTxt}>Uploading video… {Math.round(uploadProgress * 100)}%</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Add media</Text>
          <View style={styles.attachRow}>
            <Pressable testID="take-photo" style={styles.attachBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={22} color={colors.brand} />
              <Text style={styles.attachTxt}>Camera</Text>
            </Pressable>
            <Pressable testID="record-video" style={styles.attachBtn} onPress={recordVideo}>
              <Ionicons name="videocam-outline" size={22} color={colors.brand} />
              <Text style={styles.attachTxt}>Record</Text>
            </Pressable>
            <Pressable testID="pick-image" style={styles.attachBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color={colors.brand} />
              <Text style={styles.attachTxt}>Photo</Text>
            </Pressable>
            <Pressable testID="pick-video" style={styles.attachBtn} onPress={pickVideo}>
              <Ionicons name="film-outline" size={22} color={colors.brand} />
              <Text style={styles.attachTxt}>Video</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Or paste a video link (YouTube / MP4)</Text>
          <View style={styles.linkField}>
            <Ionicons name="link-outline" size={20} color={colors.muted} />
            <TextInput
              testID="video-url-input"
              style={{ flex: 1, fontSize: font.size.base, color: colors.onSurface }}
              placeholder="https://youtube.com/watch?v=…"
              placeholderTextColor={colors.muted}
              value={videoUrl}
              onChangeText={(v) => { setVideoUrl(v); if (v) setUploadedVideo(null); }}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.hint}>Tip: Record up to 60s directly from your camera, or share YouTube videos of organic procedures, composting & waste management.</Text>

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
  videoChip: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md },
  videoChipTxt: { flex: 1, color: colors.brand, fontWeight: "600", fontSize: font.size.base },
  uploadWrap: { gap: 6 },
  uploadBarBg: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  uploadBar: { height: 8, borderRadius: 4, backgroundColor: colors.brand },
  uploadTxt: { fontSize: font.size.xs, color: colors.onSurfaceTertiary },
  attachRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill },
  attachTxt: { color: colors.brand, fontWeight: "600" },
  linkField: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, height: 48 },
  hint: { fontSize: font.size.xs, color: colors.muted, lineHeight: 16 },
  err: { color: colors.error, fontSize: font.size.base, textAlign: "center" },
});
