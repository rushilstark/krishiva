import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";

const W = Dimensions.get("window").width;

export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [a, setA] = useState<any>(null);

  useEffect(() => { api.getArticle(id!).then(setA).catch(() => {}); }, [id]);

  if (!a) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={{ position: "relative" }}>
          <Image source={{ uri: a.cover }} style={styles.cover} contentFit="cover" />
          <SafeAreaView style={styles.topBtnWrap} edges={["top"]}>
            <Pressable testID="close-article" style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </View>
        <View style={styles.body}>
          <View style={styles.tag}><Text style={styles.tagText}>{a.category}</Text></View>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.meta}>By {a.author} · {a.read_time}</Text>
          <View style={styles.divider} />
          <Text style={styles.excerpt}>{a.excerpt}</Text>
          <Text style={styles.paragraph}>{a.body}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  cover: { width: "100%", height: W * 0.65 },
  topBtnWrap: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "flex-end", padding: spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  body: { padding: spacing.xl },
  tag: { alignSelf: "flex-start", backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { color: colors.brand, fontWeight: "600", fontSize: font.size.xs },
  title: { fontSize: 26, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm, lineHeight: 32 },
  meta: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  excerpt: { fontSize: font.size.lg, color: colors.onSurfaceSecondary, fontStyle: "italic", lineHeight: 24, marginBottom: spacing.md },
  paragraph: { fontSize: font.size.lg, color: colors.onSurface, lineHeight: 26 },
});
