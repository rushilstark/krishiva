import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";

const W = Dimensions.get("window").width;

export default function Learn() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listArticles().then((a) => { setArticles(a); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const [featured, ...rest] = articles;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Learn</Text>
        <Text style={styles.sub}>Guides and knowledge for organic farming</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
          {featured ? (
            <Pressable testID={`article-${featured.id}`} style={styles.featured} onPress={() => router.push(`/article/${featured.id}`)}>
              <Image source={{ uri: featured.cover }} style={styles.featuredImg} contentFit="cover" />
              <View style={styles.featuredBody}>
                <View style={styles.tag}><Text style={styles.tagText}>{featured.category}</Text></View>
                <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
                <Text style={styles.featuredExcerpt} numberOfLines={2}>{featured.excerpt}</Text>
                <Text style={styles.meta}>{featured.author} · {featured.read_time}</Text>
              </View>
            </Pressable>
          ) : null}

          <Text style={styles.sectionTitle}>More reads</Text>
          {rest.map((a) => (
            <Pressable key={a.id} testID={`article-${a.id}`} style={styles.row} onPress={() => router.push(`/article/${a.id}`)}>
              <Image source={{ uri: a.cover }} style={styles.rowImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowCat}>{a.category}</Text>
                <Text style={styles.rowTitle} numberOfLines={2}>{a.title}</Text>
                <Text style={styles.rowMeta}>{a.read_time}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  h1: { fontSize: 28, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: font.size.base, color: colors.onSurfaceTertiary, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  featured: { marginHorizontal: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  featuredImg: { width: "100%", height: W * 0.5 },
  featuredBody: { padding: spacing.md, gap: 6 },
  tag: { alignSelf: "flex-start", backgroundColor: colors.brandTertiary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { fontSize: font.size.xs, color: colors.brand, fontWeight: "600" },
  featuredTitle: { fontSize: font.size.xl, fontWeight: "700", color: colors.onSurface },
  featuredExcerpt: { fontSize: font.size.base, color: colors.onSurfaceTertiary, lineHeight: 20 },
  meta: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  sectionTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: "center" },
  rowImg: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  rowCat: { fontSize: font.size.xs, color: colors.brand, fontWeight: "600", textTransform: "uppercase" },
  rowTitle: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurface, marginTop: 2 },
  rowMeta: { fontSize: font.size.xs, color: colors.muted, marginTop: 4 },
});
