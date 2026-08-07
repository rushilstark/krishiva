import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";

const SUGGESTIONS = [
  "How do I make compost from kitchen waste?",
  "Best organic pest control for tomato",
  "When to sow moong in Maharashtra?",
  "Signs of nitrogen deficiency in wheat",
];

export default function AI() {
  const [msgs, setMsgs] = useState<{ role: string; text: string; id: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [session] = useState<string>(`sess-${Date.now()}`);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setMsgs([{ id: "welcome", role: "assistant", text: "Namaste! I'm Krishiva Sahayak 🌱 — ask me anything about organic farming, composting, pest control or crop planning." }]);
  }, []);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || sending) return;
    setInput("");
    const userMsg = { id: `u-${Date.now()}`, role: "user", text: q };
    setMsgs((m) => [...m, userMsg]);
    setSending(true);
    try {
      const res = await api.aiChat(q, session);
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
            <Text style={styles.sub}>AI helper powered by Gemini</Text>
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
              <Text style={[styles.bubbleText, item.role === "user" && { color: "#fff" }]}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={sending ? (
            <View style={[styles.bubble, styles.aiBubble, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={styles.bubbleText}>Thinking…</Text>
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

        <View style={styles.inputRow}>
          <TextInput
            testID="ai-input"
            style={styles.input}
            placeholder="Ask about your farm…"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            multiline
          />
          <Pressable testID="ai-send" onPress={() => send()} style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.5 }]} disabled={!input.trim() || sending}>
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
  suggWrap: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  sugg: { backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  suggText: { fontSize: font.size.base, color: colors.brand, fontWeight: "500" },
  inputRow: { flexDirection: "row", padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary, alignItems: "flex-end" },
  input: { flex: 1, minHeight: 42, maxHeight: 120, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: radius.lg, fontSize: font.size.base, color: colors.onSurface, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
