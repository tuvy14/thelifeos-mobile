import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { PressableScale, Reveal, CountUp } from "@/components/anim";
import Logo from "@/components/logo";
import { useStore } from "@/lib/store";
import {
  PLANS,
  PRO_FEATURES,
  SOCIAL_PROOF,
  TRIAL_DAYS,
  ACCEPTED_METHODS,
  openCheckout,
  billingConfigured,
  type PlanId,
} from "@/lib/billing";
import {
  iapAvailable,
  purchasePlan,
  restorePurchases,
  hasPro,
  planFromInfo,
  type CustomerInfo,
} from "@/lib/iap";

/** Full-screen, non-dismissible paywall shown after onboarding. Nothing in the
 *  app is free — the user must start the free trial or buy lifetime to continue.
 *
 *  Stripe Payment Links can't be verified on-device (no secret keys). Crucially,
 *  simply *closing* the hosted checkout (the X) must NOT unlock the app, or anyone
 *  could tap-X straight past the paywall. So returning from checkout shows an
 *  explicit "I've completed payment" confirmation, and only that unlocks. Swap this
 *  for a Stripe-webhook → Supabase entitlement check when you want hard enforcement. */
export default function Paywall() {
  const { c } = useTheme();
  const s = makeStyles(c);
  const insets = useSafeAreaInsets();
  const { startTrial, setPlan } = useStore();

  const [selected, setSelected] = useState<PlanId>("monthly");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Stripe fallback only: after the hosted sheet closes we land here, and the user
  // must confirm payment before anything unlocks (closing it never grants access).
  // The native StoreKit path is verified, so it never uses this.
  const [confirming, setConfirming] = useState(false);

  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[0];

  const pick = (id: PlanId) => {
    try { Haptics.selectionAsync(); } catch { /* ignore */ }
    setSelected(id);
  };

  const grant = () => {
    if (plan.id === "monthly") startTrial();
    else setPlan("lifetime");
  };

  // Unlock from an Apple-verified entitlement (native StoreKit path).
  const unlock = (info: CustomerInfo) => setPlan(planFromInfo(info) ?? "monthly");

  const checkout = async () => {
    if (busy) return;
    setNote(null);
    setBusy(true);

    // ── Native StoreKit (App-Store-compliant) — the real Apple payment sheet ──
    if (iapAvailable) {
      const r = await purchasePlan(plan.id);
      setBusy(false);
      if (r.status === "ok") unlock(r.info); // Apple-verified → unlock immediately
      else if (r.status === "error") setNote(r.message);
      else if (r.status === "unavailable") setNote("Purchases aren't available right now — try again shortly.");
      // cancelled → stay on the paywall, nothing unlocks
      return;
    }

    // ── Stripe fallback (web / Expo Go before a native build) ──
    const res = await openCheckout(plan);
    setBusy(false);
    if (res.ok) {
      // The sheet closed. We can't tell *from here* whether they paid or just
      // tapped X — so we do NOT grant. Ask them to confirm explicitly instead.
      setConfirming(true);
    } else if (res.reason === "unconfigured") {
      setNote("Checkout isn't set up yet — add your Stripe Payment Link to enable purchases.");
    }
  };

  const restore = async () => {
    if (restoring) return;
    setNote(null);
    setRestoring(true);
    const r = await restorePurchases();
    setRestoring(false);
    if (r.status === "ok" && hasPro(r.info)) unlock(r.info);
    else if (r.status === "ok") setNote("No previous purchase found on this Apple ID.");
    else if (r.status === "error") setNote(r.message);
  };

  const ctaLabel =
    plan.id === "monthly" ? `Start ${TRIAL_DAYS}-day free trial` : `Get Lifetime · ${plan.price}`;

  return (
    <View style={[s.root, { paddingTop: insets.top + 20 }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Brand */}
        <Reveal>
          <View style={s.brandRow}>
            <Logo height={26} />
            <Text style={[s.brand, { color: c.ink }]}>
              TheLife<Text style={{ color: c.inkMuted }}>OS</Text>
            </Text>
          </View>
        </Reveal>

        <Reveal delay={60}>
          <Text style={[s.eyebrow, { color: c.inkFaint }]}>THELIFEOS PRO</Text>
          <Text style={[s.title, { color: c.ink }]}>Your better days start now</Text>
          <Text style={[s.lead, { color: c.inkMuted }]}>
            One calm place for your whole life. Try every tool free for {TRIAL_DAYS} days — no charge until it ends.
          </Text>
        </Reveal>

        {/* Social proof */}
        <Reveal delay={120}>
          <View style={[s.proof, { borderColor: c.line, backgroundColor: c.card }]}>
            <View style={s.proofMain}>
              <CountUp value={SOCIAL_PROOF.statPercent} duration={1100} format={(n) => `${Math.round(n)}%`} style={[s.proofStat, { color: c.ink }]} />
              <Text style={[s.proofLine, { color: c.inkMuted }]}>{SOCIAL_PROOF.statLine}</Text>
            </View>
            <View style={[s.proofDivider, { backgroundColor: c.line }]} />
            <View style={s.proofFoot}>
              <View style={s.proofFootItem}>
                <View style={s.stars}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Ionicons key={i} name="star" size={12} color={c.ink} />
                  ))}
                </View>
                <Text style={[s.proofFootText, { color: c.inkFaint }]}>{SOCIAL_PROOF.rating} average rating</Text>
              </View>
              <View style={s.proofFootItem}>
                <Text style={[s.proofFootStrong, { color: c.ink }]}>{SOCIAL_PROOF.members}</Text>
                <Text style={[s.proofFootText, { color: c.inkFaint }]}>{SOCIAL_PROOF.membersLine}</Text>
              </View>
            </View>
          </View>
        </Reveal>

        {/* Plans */}
        <View style={{ marginTop: 18, gap: 12 }}>
          {PLANS.map((p, i) => {
            const on = p.id === selected;
            return (
              <Reveal key={p.id} delay={160 + i * 70}>
                <PressableScale onPress={() => pick(p.id)} scaleTo={0.98}>
                  <View style={[s.plan, { borderColor: on ? c.ink : c.line, backgroundColor: c.card }, on && s.planOn]}>
                    <View style={[s.radio, { borderColor: on ? c.ink : c.lineStrong }]}>
                      {on ? <View style={[s.radioDot, { backgroundColor: c.ink }]} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.planHead}>
                        <Text style={[s.planName, { color: c.ink }]}>{p.name}</Text>
                        {p.badge ? (
                          <View style={[s.badge, { backgroundColor: c.ink }]}>
                            <Text style={[s.badgeText, { color: c.obsidian }]}>{p.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[s.planBlurb, { color: c.inkMuted }]}>{p.blurb}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[s.price, { color: c.ink }]}>{p.price}</Text>
                      <Text style={[s.cadence, { color: c.inkFaint }]}>{p.cadence}</Text>
                    </View>
                  </View>
                </PressableScale>
              </Reveal>
            );
          })}
        </View>

        {/* Features */}
        <Reveal delay={320} style={{ marginTop: 20 }}>
          {PRO_FEATURES.slice(0, 4).map((f) => (
            <View key={f} style={s.featRow}>
              <View style={[s.tick, { borderColor: c.line, backgroundColor: c.fill }]}>
                <Ionicons name="checkmark" size={12} color={c.ink} />
              </View>
              <Text style={[s.featText, { color: c.ink }]}>{f}</Text>
            </View>
          ))}
        </Reveal>

        {/* CTA */}
        <Reveal delay={380} style={{ marginTop: 22 }}>
          {confirming ? (
            /* Returned from Stripe — confirm before unlocking. Closing the sheet (X)
               lands here too, so an accidental dismiss never gets into the app. */
            <View style={[s.confirm, { borderColor: c.line, backgroundColor: c.card }]}>
              <View style={[s.confirmIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
                <Ionicons name="lock-open-outline" size={18} color={c.ink} />
              </View>
              <Text style={[s.confirmTitle, { color: c.ink }]}>Did your payment go through?</Text>
              <Text style={[s.confirmSub, { color: c.inkMuted }]}>
                {plan.id === "monthly"
                  ? `Tap confirm only once Stripe shows it succeeded — your ${TRIAL_DAYS}-day free trial starts now.`
                  : "Tap confirm only once Stripe shows your payment succeeded."}
              </Text>
              <PressableScale style={[s.cta, { backgroundColor: c.ink, marginTop: 4 }]} onPress={grant}>
                <Ionicons name="checkmark" size={17} color={c.obsidian} />
                <Text style={[s.ctaText, { color: c.obsidian }]}>Yes — unlock TheLifeOS</Text>
              </PressableScale>
              <Pressable onPress={checkout} disabled={busy} style={s.confirmAlt}>
                <Text style={[s.confirmAltText, { color: c.ink }]}>Reopen checkout</Text>
              </Pressable>
              <Pressable onPress={() => setConfirming(false)} style={s.confirmAlt}>
                <Text style={[s.confirmAltText, { color: c.inkFaint }]}>I didn&apos;t complete payment</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <PressableScale style={[s.cta, { backgroundColor: c.ink }]} onPress={checkout} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={c.obsidian} />
                ) : (
                  <>
                    <Text style={[s.ctaText, { color: c.obsidian }]}>{ctaLabel}</Text>
                    <Ionicons name="arrow-forward" size={17} color={c.obsidian} />
                  </>
                )}
              </PressableScale>
              {ACCEPTED_METHODS.applePay ? (
                <View style={s.methods}>
                  <Ionicons name="logo-apple" size={15} color={c.inkMuted} />
                  <Text style={[s.methodsText, { color: c.inkMuted }]}>Pay with {ACCEPTED_METHODS.label}</Text>
                </View>
              ) : null}
              <Text style={[s.fine, { color: c.inkFaint }]}>
                {iapAvailable ? "Billed securely through the App Store." : "Secure checkout by Stripe."}{" "}
                {plan.id === "monthly" ? `No charge for ${TRIAL_DAYS} days — cancel anytime.` : "One payment, no subscription."}
              </Text>
              {iapAvailable ? (
                <Pressable onPress={restore} disabled={restoring} style={s.restore}>
                  {restoring ? (
                    <ActivityIndicator color={c.inkFaint} size="small" />
                  ) : (
                    <Text style={[s.restoreText, { color: c.inkMuted }]}>Restore purchases</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
          {note ? <Text style={[s.fine, { color: c.danger, marginTop: 4 }]}>{note}</Text> : null}
        </Reveal>

        {/* Dev-only escape hatch — never shown once a Payment Link is configured. */}
        {__DEV__ && !billingConfigured ? (
          <PressableScale onPress={grant} style={s.devSkip} scaleTo={0.96}>
            <Text style={[s.devSkipText, { color: c.inkFaint }]}>Dev: skip (billing not configured)</Text>
          </PressableScale>
        ) : null}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.obsidian },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 9, justifyContent: "center" },
    brand: { fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: -0.3 },
    eyebrow: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, marginTop: 22, textAlign: "center" },
    title: { fontFamily: fonts.displayBold, fontSize: 28, letterSpacing: -0.7, textAlign: "center", marginTop: 8 },
    lead: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, textAlign: "center", marginTop: 10, alignSelf: "center", maxWidth: 380 },
    proof: { borderWidth: 1, borderRadius: radius.xl, padding: 18, marginTop: 22 },
    proofMain: { alignItems: "center" },
    proofStat: { fontFamily: fonts.displayBold, fontSize: 44, letterSpacing: -1 },
    proofLine: { fontFamily: fonts.body, fontSize: 13.5, textAlign: "center", marginTop: 2, lineHeight: 19, maxWidth: 300 },
    proofDivider: { height: 1, marginVertical: 16 },
    proofFoot: { flexDirection: "row", gap: 14 },
    proofFootItem: { flex: 1, alignItems: "center" },
    stars: { flexDirection: "row", gap: 2, marginBottom: 4 },
    proofFootStrong: { fontFamily: fonts.displayBold, fontSize: 16, marginBottom: 4 },
    proofFootText: { fontFamily: fonts.body, fontSize: 11.5, textAlign: "center", lineHeight: 16 },
    plan: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
    planOn: { shadowColor: c.ink, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    planHead: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    planName: { fontFamily: fonts.display, fontSize: 17 },
    badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.3 },
    planBlurb: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 4, lineHeight: 17 },
    price: { fontFamily: fonts.displayBold, fontSize: 22, letterSpacing: -0.5 },
    cadence: { fontFamily: fonts.body, fontSize: 11, marginTop: 1 },
    featRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
    tick: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    featText: { fontFamily: fonts.body, fontSize: 14, flex: 1 },
    cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.pill, paddingVertical: 17, minHeight: 56 },
    ctaText: { fontFamily: fonts.bodyBold, fontSize: 16 },
    methods: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
    methodsText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
    confirm: { borderWidth: 1, borderRadius: radius.xl, padding: 20, alignItems: "center" },
    confirmIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    confirmTitle: { fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: -0.3, textAlign: "center", marginTop: 14 },
    confirmSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8, marginBottom: 16, maxWidth: 320 },
    confirmAlt: { alignSelf: "center", marginTop: 12, padding: 6 },
    confirmAltText: { fontFamily: fonts.bodySemibold, fontSize: 13 },
    restore: { alignSelf: "center", marginTop: 12, padding: 6 },
    restoreText: { fontFamily: fonts.bodySemibold, fontSize: 13 },
    fine: { fontFamily: fonts.body, fontSize: 11.5, textAlign: "center", marginTop: 10, lineHeight: 16 },
    devSkip: { alignSelf: "center", marginTop: 18, padding: 8 },
    devSkipText: { fontFamily: fonts.mono, fontSize: 11 },
  });
