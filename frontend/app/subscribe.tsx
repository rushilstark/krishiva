import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Platform, Animated, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { colors, spacing, font, radius, shadow } from "@/src/theme";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";

const { width: W } = Dimensions.get("window");

const BENEFITS = [
  { icon: "shield-checkmark-outline", color: "#1D9BF0", bg: "#E8F5FE", text: "Verified member badge on your profile" },
  { icon: "rocket-outline", color: "#F0A31D", bg: "#FEF6E4", text: "Priority placement for your posts in the feed" },
  { icon: "star-outline", color: "#9B59B6", bg: "#F3EBFD", text: "Build trust with farmers and buyers" },
];

const TRUST = [
  { icon: "lock-closed-outline", label: "Secure Payment" },
  { icon: "refresh-outline",     label: "No Auto-Renewal" },
  { icon: "shield-outline",      label: "Razorpay Protected" },
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const monthlyScale = useRef(new Animated.Value(1)).current;
  const yearlyScale = useRef(new Animated.Value(1.02)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.getPlans().then(setCfg).catch(() => setErr("Could not load plans"));
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const selectPlan = (p: "monthly" | "yearly") => {
    setPlan(p);
    Animated.spring(p === "monthly" ? monthlyScale : yearlyScale, {
      toValue: 1.04, friction: 6, useNativeDriver: true,
    }).start(() => {
      Animated.spring(p === "monthly" ? monthlyScale : yearlyScale, {
        toValue: 1, friction: 6, useNativeDriver: true,
      }).start();
    });
  };

  const finishSuccess = async () => {
    await refresh();
    setDone(true);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const pay = async () => {
    setErr(null);
    setPaying(true);
    try {
      if (!cfg?.razorpay_configured) {
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
        setErr("Payment not confirmed yet. Wait a moment and tap again.");
      }
    } catch (e: any) {
      setErr(e.message || "Could not check payment status");
    } finally {
      setChecking(false);
    }
  };

  // ── SUCCESS SCREEN ──
  if (done) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#1A4A22", "#2A7036", "#3D9A4A"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.successSafe} edges={["top", "bottom"]}>
          <Animated.View style={[styles.successWrap, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
            <View style={styles.successRing}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
            </View>
            <Text style={styles.successTitle}>You are now Verified! 🌱</Text>
            <Text style={styles.successSub}>
              Your account now has a blue checkmark and your posts will be prioritized in the community feed.
            </Text>
            <View style={styles.successBadgeRow}>
              <View style={styles.successBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#2A7036" />
                <Text style={styles.successBadgeTxt}>Verified Member</Text>
              </View>
            </View>
            <Pressable testID="sub-done" style={styles.successBtn} onPress={() => router.back()}>
              <Text style={styles.successBtnTxt}>Start Exploring</Text>
              <Ionicons name="arrow-forward" size={18} color="#2A7036" />
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ── MAIN SCREEN ──
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          bounces={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={["#0F3018", "#1A4A22", "#2A7036"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Pressable testID="sub-close" style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
            </Pressable>

            <Animated.View style={{ alignItems: "center", opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Crown badge */}
              <View style={styles.crownWrap}>
                <LinearGradient colors={["#F5D67A", "#F0A31D"]} style={styles.crownGrad}>
                  <Ionicons name="checkmark-circle" size={28} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.heroLabel}>KRISHIVA VERIFIED</Text>
              <Text style={styles.heroTitle}>Join India's Organic{"\n"}Farming Community</Text>
              <Text style={styles.heroSub}>Get the blue badge and boost your posts</Text>

              {/* Floating stats */}
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statNum}>10K+</Text>
                  <Text style={styles.statLbl}>Farmers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statPill}>
                  <Text style={styles.statNum}>₹99</Text>
                  <Text style={styles.statLbl}>Per month</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statPill}>
                  <Text style={styles.statNum}>100%</Text>
                  <Text style={styles.statLbl}>Organic</Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Benefits ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Everything included</Text>
              <View style={styles.benefitsList}>
                {BENEFITS.map((b) => (
                  <View key={b.text} style={styles.benefit}>
                    <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                      <Ionicons name={b.icon as any} size={18} color={b.color} />
                    </View>
                    <Text style={styles.benefitTxt}>{b.text}</Text>
                    <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
                  </View>
                ))}
              </View>
            </View>

            {/* ── Plan Cards ── */}
            {!cfg ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.xl }} />
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose your plan</Text>
                <View style={styles.planRow}>

                  {/* Monthly */}
                  <Animated.View style={[{ flex: 1 }, { transform: [{ scale: monthlyScale }] }]}>
                    <Pressable
                      testID="plan-monthly"
                      style={[styles.planCard, plan === "monthly" && styles.planActive]}
                      onPress={() => selectPlan("monthly")}
                    >
                      {plan === "monthly" && (
                        <LinearGradient colors={["#EBF2EC", "#D4EBD7"]} style={StyleSheet.absoluteFill} borderRadius={16} />
                      )}
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color={plan === "monthly" ? colors.brand : colors.muted}
                      />
                      <Text style={[styles.planName, plan === "monthly" && styles.planNameActive]}>Monthly</Text>
                      <Text style={[styles.planPrice, plan === "monthly" && styles.planPriceActive]}>₹99</Text>
                      <Text style={styles.planPer}>/ month</Text>
                      {plan === "monthly" && (
                        <View style={styles.selectedDot}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>

                  {/* Yearly */}
                  <Animated.View style={[{ flex: 1 }, { transform: [{ scale: yearlyScale }] }]}>
                    <Pressable
                      testID="plan-yearly"
                      style={[styles.planCard, plan === "yearly" && styles.planActive]}
                      onPress={() => selectPlan("yearly")}
                    >
                      {plan === "yearly" && (
                        <LinearGradient colors={["#EBF2EC", "#D4EBD7"]} style={StyleSheet.absoluteFill} borderRadius={16} />
                      )}
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeTxt}>BEST VALUE</Text>
                      </View>
                      <Ionicons
                        name="star-outline"
                        size={22}
                        color={plan === "yearly" ? colors.brand : colors.muted}
                      />
                      <Text style={[styles.planName, plan === "yearly" && styles.planNameActive]}>Yearly</Text>
                      <Text style={[styles.planPrice, plan === "yearly" && styles.planPriceActive]}>₹999</Text>
                      <Text style={styles.planPer}>/ year</Text>
                      <Text style={styles.planSave}>Save ₹189</Text>
                      {plan === "yearly" && (
                        <View style={styles.selectedDot}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>

                {/* Dev mode banner */}
                {!cfg.razorpay_configured && (
                  <View style={styles.devBanner}>
                    <Ionicons name="flask-outline" size={15} color="#8A6A1F" />
                    <Text style={styles.devBannerTxt}>
                      Test mode — tap below to activate instantly without payment.
                    </Text>
                  </View>
                )}

                {err ? (
                  <View style={styles.errBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                    <Text style={styles.errTxt} testID="sub-error">{err}</Text>
                  </View>
                ) : null}

                {/* Payment CTA */}
                {awaitingLink ? (
                  <Pressable
                    testID="sub-check-paid"
                    style={[styles.payBtn, checking && { opacity: 0.7 }]}
                    onPress={checkPaid}
                    disabled={checking}
                  >
                    {checking
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.payBtnTxt}>I've completed payment ✓</Text>
                    }
                  </Pressable>
                ) : (
                  <Pressable
                    testID="sub-pay"
                    style={[styles.payBtn, paying && { opacity: 0.7 }]}
                    onPress={pay}
                    disabled={paying}
                  >
                    <LinearGradient
                      colors={["#2E8040", "#2A7036", "#1F5428"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.payBtnGrad}
                    >
                      {paying ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons
                            name={cfg.razorpay_configured ? "card-outline" : "flash-outline"}
                            size={20}
                            color="#fff"
                          />
                          <Text style={styles.payBtnTxt}>
                            {cfg.razorpay_configured
                              ? `Pay ${plan === "monthly" ? "₹99" : "₹999"} with Razorpay`
                              : `Activate ${plan === "monthly" ? "Monthly" : "Yearly"} — Test Mode`}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Trust badges */}
                <View style={styles.trustRow}>
                  {TRUST.map((t) => (
                    <View key={t.label} style={styles.trustItem}>
                      <Ionicons name={t.icon as any} size={14} color={colors.muted} />
                      <Text style={styles.trustTxt}>{t.label}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.smallPrint}>
                  One-time payment for selected term. No auto-renewal. Verified badge granted on activation.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  // Hero
  hero: {
    paddingTop: 60, paddingBottom: 36, paddingHorizontal: spacing.xl,
    alignItems: "center",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  crownWrap: { marginBottom: spacing.md },
  crownGrad: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  heroLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 2.5, color: "rgba(255,255,255,0.6)", marginBottom: 6 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 34 },
  heroSub: { fontSize: font.size.base, color: "rgba(255,255,255,0.75)", marginTop: 6, textAlign: "center" },
  statsRow: {
    flexDirection: "row", marginTop: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: spacing.lg,
    width: "100%", alignItems: "center", justifyContent: "space-around",
  },
  statPill: { alignItems: "center" },
  statNum: { fontSize: font.size.lg, fontWeight: "800", color: "#fff" },
  statLbl: { fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // Sections
  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: font.size.lg, fontWeight: "700", color: colors.onSurface },

  // Benefits
  benefitsList: { gap: 10 },
  benefit: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  benefitIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  benefitTxt: { flex: 1, fontSize: font.size.base, color: colors.onSurfaceSecondary, lineHeight: 20 },

  // Plans
  planRow: { flexDirection: "row", gap: spacing.md },
  planCard: {
    flex: 1, borderRadius: 16, borderWidth: 2, borderColor: colors.border,
    padding: spacing.lg, alignItems: "center", gap: 4,
    backgroundColor: colors.surfaceSecondary, overflow: "hidden",
    minHeight: 160,
  },
  planActive: { borderColor: colors.brand },
  planName: { fontSize: font.size.base, fontWeight: "600", color: colors.muted, marginTop: 4 },
  planNameActive: { color: colors.brand },
  planPrice: { fontSize: 32, fontWeight: "800", color: colors.onSurface },
  planPriceActive: { color: colors.brand },
  planPer: { fontSize: font.size.xs, color: colors.muted },
  planSave: { fontSize: font.size.xs, fontWeight: "700", color: "#E8405A", marginTop: 2 },
  bestBadge: {
    position: "absolute", top: -1, right: -1,
    backgroundColor: colors.warning, paddingHorizontal: 10, paddingVertical: 4,
    borderTopRightRadius: 14, borderBottomLeftRadius: 10,
  },
  bestBadgeTxt: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.8 },
  selectedDot: {
    position: "absolute", bottom: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.brand, alignItems: "center", justifyContent: "center",
  },

  // Dev banner
  devBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "#FEF6E4", borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: "#F5DFAF",
  },
  devBannerTxt: { flex: 1, fontSize: font.size.xs, color: "#8A6A1F", lineHeight: 16 },

  // Error
  errBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "#FDE8EB", borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: "#F5AFAF",
  },
  errTxt: { flex: 1, color: colors.error, fontSize: font.size.sm },

  // Pay button
  payBtn: { borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.sm },
  payBtnGrad: {
    height: 56, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.xl,
  },
  payBtnTxt: { color: "#fff", fontSize: font.size.lg, fontWeight: "700" },

  // Trust
  trustRow: { flexDirection: "row", justifyContent: "center", gap: spacing.lg, marginTop: spacing.sm },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustTxt: { fontSize: font.size.xs, color: colors.muted },

  smallPrint: { fontSize: font.size.xs, color: colors.muted, textAlign: "center", lineHeight: 16, paddingBottom: spacing.sm },

  // Success screen
  successSafe: { flex: 1 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  successRing: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  successCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center" },
  successSub: { fontSize: font.size.base, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 22 },
  successBadgeRow: { flexDirection: "row", justifyContent: "center" },
  successBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  successBadgeTxt: { fontSize: font.size.sm, fontWeight: "700", color: "#2A7036" },
  successBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "#fff", borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl, paddingVertical: 16, marginTop: spacing.sm,
  },
  successBtnTxt: { fontSize: font.size.lg, fontWeight: "700", color: "#2A7036" },
});
