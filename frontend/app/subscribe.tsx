import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { colors, spacing, font, radius } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const BENEFITS = [
  { icon: "videocam", text: "Post photos & videos to the community" },
  { icon: "person-add", text: "Follow farmers, experts & learners" },
  { icon: "chatbubbles", text: "Direct chat with anyone on Krishiva" },
  { icon: "leaf", text: "Support India's organic farming movement" },
];

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((globalThis as any).Razorpay) return resolve();
    const s = (globalThis as any).document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load payment page"));
    (globalThis as any).document.body.appendChild(s);
  });
}

export default function Subscribe() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [cfg, setCfg] = useState<any>(null);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [paying, setPaying] = useState(false);
  const [awaitingLink, setAwaitingLink] = useState(false);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getPlans().then(setCfg).catch(() => setErr("Could not load plans"));
  }, []);

  const finishSuccess = async () => {
    await refresh();
    setDone(true);
  };

  const pay = async () => {
    setErr(null);
    setPaying(true);
    try {
      if (!cfg?.razorpay_configured) {
        // TEST MODE — activates instantly until Razorpay keys are configured
        await api.devActivate(plan);
        await finishSuccess();
        return;
      }
      if (Platform.OS !== "web") {
        const { url } = await api.createPaymentLink(plan);
        setAwaitingLink(true);
        await WebBrowser.openBrowserAsync(url);
      } else {
        const data = await api.createOrder(plan);
        await loadRazorpayScript();
        const rzp = new (globalThis as any).Razorpay({
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: "Krishiva Plus",
          description: data.name,
          order_id: data.order_id,
          prefill: { email: user?.email, contact: user?.phone },
          theme: { color: "#2A7036" },
          handler: async (response: any) => {
            try {
              await api.verifyPayment(response);
              await finishSuccess();
            } catch (e: any) {
              setErr(e.message || "Payment verification failed");
            }
          },
        });
        rzp.open();
      }
    } catch (e: any) {
      setErr(e.message || "Payment could not be started");
    } finally {
      setPaying(false);
    }
  };

  const checkPaid = async () => {
    setChecking(true);
    setErr(null);
    try {
      const s = await api.mySubscription();
      if (s.subscribed) {
        await finishSuccess();
      } else {
        setErr("Payment not confirmed yet. If you completed it, wait a few seconds and tap again.");
      }
    } catch (e: any) {
      setErr(e.message || "Could not check payment status");
    } finally {
      setChecking(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}><Ionicons name="checkmark" size={44} color="#fff" /></View>
          <Text style={styles.doneTitle}>Welcome to Krishiva Plus! 🌱</Text>
          <Text style={styles.doneSub}>You can now post photos & videos, follow anyone and chat directly.</Text>
          <Pressable testID="sub-done" style={styles.payBtn} onPress={() => router.back()}>
            <Text style={styles.payBtnTxt}>Start exploring</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#2A7036", "#1A4A22"]} style={styles.hero}>
          <Pressable testID="sub-close" style={styles.closeBtn} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <View style={styles.crown}><Ionicons name="sparkles" size={30} color="#F0A31D" /></View>
          <Text style={styles.heroTitle}>Krishiva Plus</Text>
          <Text style={styles.heroSub}>{"Become a full member of India's organic farming community"}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <View style={styles.benefitIcon}><Ionicons name={b.icon as any} size={18} color={colors.brand} /></View>
              <Text style={styles.benefitTxt}>{b.text}</Text>
            </View>
          ))}

          {!cfg ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
          ) : (
            <>
              <View style={styles.planRow}>
                <Pressable
                  testID="plan-monthly"
                  style={[styles.planCard, plan === "monthly" && styles.planActive]}
                  onPress={() => setPlan("monthly")}
                >
                  <Text style={[styles.planName, plan === "monthly" && { color: colors.brand }]}>Monthly</Text>
                  <Text style={styles.planPrice}>₹99</Text>
                  <Text style={styles.planPer}>per month</Text>
                </Pressable>
                <Pressable
                  testID="plan-yearly"
                  style={[styles.planCard, plan === "yearly" && styles.planActive]}
                  onPress={() => setPlan("yearly")}
                >
                  <View style={styles.bestBadge}><Text style={styles.bestBadgeTxt}>BEST VALUE</Text></View>
                  <Text style={[styles.planName, plan === "yearly" && { color: colors.brand }]}>Yearly</Text>
                  <Text style={styles.planPrice}>₹999</Text>
                  <Text style={styles.planPer}>per year · 2 months free</Text>
                </Pressable>
              </View>

              {!cfg.razorpay_configured ? (
                <View style={styles.devBanner}>
                  <Ionicons name="flask-outline" size={16} color={colors.warning} />
                  <Text style={styles.devBannerTxt}>Test mode — payment gateway keys not added yet. Subscription activates instantly for testing.</Text>
                </View>
              ) : null}

              {err ? <Text style={styles.err} testID="sub-error">{err}</Text> : null}

              {awaitingLink ? (
                <Pressable testID="sub-check-paid" style={[styles.payBtn, checking && { opacity: 0.7 }]} onPress={checkPaid} disabled={checking}>
                  {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnTxt}>{"I've completed payment"}</Text>}
                </Pressable>
              ) : null}

              <Pressable testID="sub-pay" style={[styles.payBtn, paying && { opacity: 0.7 }]} onPress={pay} disabled={paying}>
                {paying ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.payBtnTxt}>
                    {cfg.razorpay_configured
                      ? `Pay ${plan === "monthly" ? "₹99" : "₹999"} with Razorpay`
                      : `Activate ${plan === "monthly" ? "Monthly" : "Yearly"} (Test Mode)`}
                  </Text>
                )}
              </Pressable>
              <Text style={styles.smallPrint}>One-time payment for the selected term. No auto-renewal. Cancel anytime by simply not renewing.</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { alignItems: "center", paddingTop: spacing.xxl, paddingBottom: spacing.xxl, paddingHorizontal: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  closeBtn: { position: "absolute", top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  crown: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "700" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: font.size.base, textAlign: "center", marginTop: spacing.xs, lineHeight: 20 },
  body: { padding: spacing.xl, gap: spacing.md },
  benefit: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  benefitTxt: { flex: 1, fontSize: font.size.base, color: colors.onSurfaceSecondary, lineHeight: 20 },
  planRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  planCard: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, padding: spacing.lg, alignItems: "center" },
  planActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  planName: { fontSize: font.size.base, fontWeight: "600", color: colors.onSurfaceTertiary },
  planPrice: { fontSize: 30, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  planPer: { fontSize: font.size.xs, color: colors.muted, marginTop: 2, textAlign: "center" },
  bestBadge: { position: "absolute", top: -10, backgroundColor: colors.warning, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  bestBadgeTxt: { fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  devBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "#FFF7E6", borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: "#F5DFAF" },
  devBannerTxt: { flex: 1, fontSize: font.size.xs, color: "#8A6A1F", lineHeight: 16 },
  err: { color: colors.error, fontSize: font.size.base, textAlign: "center" },
  payBtn: { backgroundColor: colors.brand, borderRadius: radius.pill, height: 54, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  payBtnTxt: { color: "#fff", fontSize: font.size.lg, fontWeight: "600" },
  smallPrint: { fontSize: font.size.xs, color: colors.muted, textAlign: "center", lineHeight: 16 },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  doneIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: font.size.xxl, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  doneSub: { fontSize: font.size.base, color: colors.onSurfaceTertiary, textAlign: "center", lineHeight: 20 },
});
