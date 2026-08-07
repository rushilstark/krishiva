import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { initials, timeAgo } from "@/src/utils";

export default function ChatScreen() {
  const { id: otherId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const [u, m] = await Promise.all([api.getUser(otherId!), api.listMessages(otherId!)]);
      setOther(u);
      setMessages(m);
    } catch {}
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [otherId]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    if (!user?.subscribed) { router.push("/subscribe"); return; }
    const t = text.trim();
    setText("");
    try {
      const msg = await api.sendMessage(otherId!, t);
      setMessages((m) => [...m, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      if (e.message === "subscription_required") router.push("/subscribe");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Pressable style={styles.headerUser} onPress={() => other && router.push(`/user/${other.id}`)}>
          {other?.avatar ? <Image source={{ uri: other.avatar }} style={styles.hAv} /> :
            <View style={[styles.hAv, styles.avPh]}><Text style={styles.avTxt}>{initials(other?.name || "?")}</Text></View>}
          <View>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
              <Text style={styles.hName}>{other?.name || "Loading…"}</Text>
              {other?.verified ? <Ionicons name="checkmark-circle" size={13} color={colors.brand} /> : null}
            </View>
            {other?.location ? <Text style={styles.hMeta}>{other.location}</Text> : null}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            ref={listRef}
            testID="chat-messages"
            data={messages}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: spacing.md, gap: 6 }}
            renderItem={({ item }) => {
              const mine = item.from_user_id === user?.id;
              return (
                <View style={[styles.msg, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.msgTxt, mine && { color: "#fff" }]}>{item.text}</Text>
                  <Text style={[styles.msgTime, mine && { color: "rgba(255,255,255,0.7)" }]}>{timeAgo(item.created_at)}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>Say hi 👋 — start the conversation</Text>}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            testID="chat-input"
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable testID="chat-send" onPress={send} style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]} disabled={!text.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceSecondary },
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary },
  avPh: { alignItems: "center", justifyContent: "center" },
  avTxt: { color: colors.brand, fontWeight: "700", fontSize: 12 },
  hName: { fontWeight: "600", fontSize: font.size.lg, color: colors.onSurface },
  hMeta: { fontSize: font.size.xs, color: colors.muted },
  msg: { maxWidth: "78%", padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, marginTop: 4 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.brand, borderTopRightRadius: 4 },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderTopLeftRadius: 4 },
  msgTxt: { color: colors.onSurface, fontSize: font.size.base, lineHeight: 20 },
  msgTime: { fontSize: 10, color: colors.muted, marginTop: 2, alignSelf: "flex-end" },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xxl },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: font.size.base, color: colors.onSurface, minHeight: 42, maxHeight: 120 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
