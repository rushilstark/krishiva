import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { ensureCameraPermission, ensureMediaLibraryPermission, uriToBase64 } from "@/src/permissions";

const SUGGESTIONS = [
  "How do I make compost from kitchen waste?",
  "Best organic pest control for tomato",
  "When to sow moong in Maharashtra?",
  "Signs of nitrogen deficiency in wheat",
];

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: string[]; // data URLs
  videoName?: string;
};

export default function AI() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [session] = useState<string>(`sess-${Date.now()}`);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]); // data URLs
  const [pendingVideo, setPendingVideo] = useState<{ id: string; name: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setMsgs([{ id: "welcome", role: "assistant", text: "Namaste! I'm Krishiva Sahayak 🌱 — ask me anything about organic farming. You can also attach a photo or video of your crop, soil or pest and I'll analyze it." }]);
  }, []);

  const addImage = (res: ImagePicker.ImagePickerResult) => {
    if (!res.canceled && res.assets[0].base64) {
      setPendingImages((imgs) => [...imgs, `data:image/jpeg;base64,${res.assets[0].base64}`].slice(0, 3));
    }
    setAttachOpen(false);
  };

  const attachCamera = async () => {
    if (!(await ensureCameraPermission())) return;
    addImage(await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.5, base64: true }));
  };

  const attachPhoto = async () => {
    if (!(await ensureMediaLibraryPermission())) return;
    addImage(await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.5, base64: true }));
  };

  const attachVideo = async () => {
    if (!(await ensureMediaLibraryPermission())) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "videos", videoMaxDuration: 60, quality: 0.5 });
    setAttachOpen(false);
    if (res.canceled || !res.assets[0]) return;
    setUploadProgress(0);
    try {
      const b64 = await uriToBase64(res.assets[0].uri);
      const { id } = await api.uploadMedia(b64, res.assets[0].mimeType || "video/mp4", (p) => setUploadProgress(p));
      setPendingVideo({ id, name: res.assets[0].fileName || "video" });
    } catch {
      // upload failed — silently drop, user can retry
    } finally {
      setUploadProgress(null);
    }
  };

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    const hasMedia = pendingImages.length > 0 || !!pendingVideo;
    if ((!q && !hasMedia) || sending) return;
    const message = q || "Please analyze the attached media and give farming advice.";
    setInput("");
    const userMsg: Msg = {
      id: `u-${Date.now()}`, role: "user", text: message,
      images: pendingImages.length ? [...pendingImages] : undefined,
      videoName: pendingVideo?.name,
    };
    const images = pendingImages.length ? pendingImages.map((i) => i.split(",")[1]) : undefined;
    const videoId = pendingVideo?.id;
    setPendingImages([]);
    setPendingVideo(null);
    setMsgs((m) => [...m, userMsg]);
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await api.aiChat(message, session, images, videoId);
      setMsgs((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: res.reply }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", text: "Sorry, I couldn't respond. Please try again." }]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
        <View style={styles.header}>
          <View style={styles.aiIcon}><Ionicons name="sparkles" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Krishi Sahayak</Text>
            <Text style={styles.sub}>AI helper · understands photos & videos</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          testID="ai-messages"
          data={msgs}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
              {item.images?.length ? (
                <View style={styles.bubbleImgRow}>
                  {item.images.map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={styles.bubbleImg} contentFit="cover" />
                  ))}
                </View>
              ) : null}
              {item.videoName ? (
                <View style={styles.videoTag}>
                  <Ionicons name="videocam" size={14} color={item.role === "user" ? "#fff" : colors.brand} />
                  <Text style={[styles.videoTagTxt, item.role === "user" && { color: "#fff" }]} numberOfLines={1}>{item.videoName}</Text>
                </View>
              ) : null}
              <Text style={[styles.bubbleText, item.role === "user" && { color: "#fff" }]}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={sending ? (
            <View style={[styles.bubble, styles.aiBubble, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={styles.bubbleText}>Analyzing…</Text>
            </View>
          ) : null}
        />

        {msgs.length <= 1 ? (
          <View style={styles.suggWrap}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} testID={`sugg-${s.slice(0, 8)}`} style={styles.sugg} onPress={() => send(s)}>
                <Text style={styles.suggText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {attachOpen ? (
          <View style={styles.attachTray} testID="ai-attach-tray">
            <Pressable testID="ai-attach-camera" style={styles.trayBtn} onPress={attachCamera}>
              <Ionicons name="camera-outline" size={20} color={colors.brand} />
              <Text style={styles.trayTxt}>Camera</Text>
            </Pressable>
            <Pressable testID="ai-attach-photo" style={styles.trayBtn} onPress={attachPhoto}>
              <Ionicons name="image-outline" size={20} color={colors.brand} />
              <Text style={styles.trayTxt}>Photo</Text>
            </Pressable>
            <Pressable testID="ai-attach-video" style={styles.trayBtn} onPress={attachVideo}>
              <Ionicons name="film-outline" size={20} color={colors.brand} />
              <Text style={styles.trayTxt}>Video</Text>
            </Pressable>
          </View>
        ) : null}

        {(pendingImages.length > 0 || pendingVideo || uploadProgress !== null) ? (
          <View style={styles.pendingRow}>
            {pendingImages.map((img, i) => (
              <View key={i} style={styles.pendingThumbWrap}>
                <Image source={{ uri: img }} style={styles.pendingThumb} contentFit="cover" />
                <Pressable style={styles.pendingX} onPress={() => setPendingImages((arr) => arr.filter((_, j) => j !== i))}>
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {pendingVideo ? (
              <View style={styles.pendingVideo}>
                <Ionicons name="videocam" size={16} color={colors.brand} />
                <Text style={styles.pendingVideoTxt} numberOfLines={1}>{pendingVideo.name}</Text>
                <Pressable onPress={() => setPendingVideo(null)} hitSlop={8}><Ionicons name="close-circle" size={16} color={colors.muted} /></Pressable>
              </View>
            ) : null}
            {uploadProgress !== null ? (
              <View style={styles.pendingVideo}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={styles.pendingVideoTxt}>Uploading {Math.round(uploadProgress * 100)}%</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <Pressable testID="ai-attach" onPress={() => setAttachOpen((o) => !o)} style={styles.attachToggle}>
            <Ionicons name={attachOpen ? "close" : "add"} size={22} color={colors.brand} />
          </Pressable>
          <TextInput
            testID="ai-input"
            style={styles.input}
            placeholder="Ask, or attach a crop photo…"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            multiline
          />
          <Pressable
            testID="ai-send"
            onPress={() => send()}
            style={[styles.sendBtn, ((!input.trim() && pendingImages.length === 0 && !pendingVideo) || sending) && { opacity: 0.5 }]}
            disabled={(!input.trim() && pendingImages.length === 0 && !pendingVideo) || sending}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  aiIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: font.size.xl, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: font.size.xs, color: colors.onSurfaceTertiary },
  bubble: { maxWidth: "85%", padding: spacing.md, borderRadius: radius.lg },
  aiBubble: { backgroundColor: colors.surfaceSecondary, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: colors.brand, alignSelf: "flex-end", borderTopRightRadius: 4 },
  bubbleText: { fontSize: font.size.base, color: colors.onSurface, lineHeight: 20 },
  bubbleImgRow: { flexDirection: "row", gap: 6, marginBottom: spacing.sm },
  bubbleImg: { width: 90, height: 90, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  videoTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  videoTagTxt: { fontSize: font.size.xs, color: colors.brand, fontWeight: "600", flexShrink: 1 },
  suggWrap: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  sugg: { backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  suggText: { fontSize: font.size.base, color: colors.brand, fontWeight: "500" },
  attachTray: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surfaceSecondary, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  trayBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill },
  trayTxt: { color: colors.brand, fontWeight: "600", fontSize: font.size.sm },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surfaceSecondary, flexWrap: "wrap" },
  pendingThumbWrap: { position: "relative" },
  pendingThumb: { width: 52, height: 52, borderRadius: radius.sm },
  pendingX: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  pendingVideo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, maxWidth: 220 },
  pendingVideoTxt: { color: colors.brand, fontSize: font.size.xs, fontWeight: "600", flexShrink: 1 },
  inputRow: { flexDirection: "row", padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary, alignItems: "flex-end" },
  attachToggle: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, minHeight: 42, maxHeight: 120, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: radius.lg, fontSize: font.size.base, color: colors.onSurface, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
