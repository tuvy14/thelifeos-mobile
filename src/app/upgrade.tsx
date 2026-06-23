import { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { SubScreen } from "@/components/sub-screen";
import { Reveal, PressableScale, CountUp } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, isPaid, trialDaysLeft } from "@/lib/store";
import { useCelebrate } from "@/lib/celebrate";
import {
  PLANS,
  PRO_FEATURES,
  SOCIAL_PROOF,
  TRIAL_DAYS,
  ACCEPTED_METHODS,
  openCheckout,
  billingConfigured,
  type Plan,
} from "@/lib/billing";

export default function UpgradeScreen() {
  const { c } = useTheme();
  const s = makeStyles(c);
  const { profile, startTrial, setPlan } = useStore();
  const { celebrate } = useCelebrate();

  const paid = isPaid(profile);
  const onTrial = profile?.plan === "trial";
  const daysLeft = trialDaysLeft(profile);
  // On trial → the obvious upgrade is Lifetime; otherwise default to the trial plan.
  const [selected, setSelected] = useState<Plan["id"]>(onTrial ? "lifetime" : "monthly");
  const [busy, setBusy] = useState(false);

  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[0];

  const pick = (id: Plan["id"]) => {
    try { Haptics.selectionAsync(); } catch { /* ignore */ }
    setSelected(id);
  };

  const grant = () => {
    if (plan.id === "monthly") startTrial();
    else setPlan("lifetime");
    celebrate(plan.id === "monthly" ? "Trial started — welcome to Pro 🔓" : "Lifetime unlocked — it's all yours 🎉");
  };

  const checkout = async () => {
    if (busy) return;
    setBusy(true);
    const res = await openCheckout(plan);
    setBusy(false);
    if (res.ok) grant();
    else if (res.reason === "unconfigured") celebrate("Checkout isn't set up yet — add your Stripe Payment Link.");
  };

  /* ── Already fully paid / admin ── */
  if (paid) {
    const lifetime = profile?.plan === "lifetime";
    return (
      <SubScreen eyebrow="TheLifeOS Pro" title="You're all in">
        <View style={[s.proBox, { borderColor: c.line, backgroundColor: c.card }]}>
          <View style={[s.proIcon, { backgroundColor: c.ink }]}>
            <Ionicons name="checkmark" size={22} color={c.obsidian} />
          </View>
          <Text style={s.proTitle}>{lifetime ? "Lifetime is active" : "Pro is active"}</Text>
          <Text style={s.proSub}>
            {lifetime
              ? "You own TheLifeOS forever — every tool and every future update. Thank you for backing it."
              : "You have full access to every tool and mode. Manage billing anytime in Stripe."}
          </Text>
        </View>
        <View style={{ marginTop: 18 }}>{PRO_FEATURES.map((f, i) => <FeatureRow key={i} c={c} text={f} />)}</View>
      </SubScreen>
    );
  }

  return (
    <SubScreen eyebrow="TheLifeOS Pro" title={onTrial ? "Keep your momentum" : "Unlock everything"}>
      {/* Trial status banner */}
      {onTrial ? (
        <View style={[s.trialBanner, { borderColor: c.line, backgroundColor: c.card }]}>
          <Ionicons name="time-outline" size={16} color={c.ink} />
          <Text style={[s.trialText, { color: c.ink }]}>
            Free trial active · <Text style={{ fontFamily: fonts.displayBold }}>{daysLeft} day{daysLeft === 1 ? "" : "s"}</Text> left
          </Text>
        </View>
      ) : (
        <Text style={[s.lead, { color: c.inkMuted }]}>
          One calm place for your whole life. Try every tool free for {TRIAL_DAYS} days — no charge until it ends.
        </Text>
      )}

      {/* Social proof */}
      <Reveal delay={60} style={{ marginTop: 16 }}>
        <View style={[s.proof, { borderColor: c.line, backgroundColor: c.card }]}>
          <CountUp value={SOCIAL_PROOF.statPercent} duration={1100} format={(n) => `${Math.round(n)}%`} style={[s.proofStat, { color: c.ink }]} />
          <Text style={[s.proofLine, { color: c.inkMuted }]}>{SOCIAL_PROOF.statLine}</Text>
          <View style={s.stars}>
            {[0, 1, 2, 3, 4].map((i) => <Ionicons key={i} name="star" size={12} color={c.ink} />)}
            <Text style={[s.proofRating, { color: c.inkFaint }]}>  {SOCIAL_PROOF.rating} · {SOCIAL_PROOF.members} members</Text>
          </View>
        </View>
      </Reveal>

      {/* Plan selector */}
      <View style={{ marginTop: 18, gap: 12 }}>
        {PLANS.map((p, i) => {
          const on = p.id === selected;
          return (
            <Reveal key={p.id} delay={120 + i * 70}>
              <PressableScale onPress={() => pick(p.id)} scaleTo={0.98}>
                <View style={[s.plan, { borderColor: on ? c.ink : c.line, backgroundColor: c.card }, on && s.planOn]}>
                  <View style={[s.radio, { borderColor: on ? c.ink : c.lineStrong }]}>
                    {on ? <View style={[s.radioDot, { backgroundColor: c.ink }]} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.planHead}>
                      <Text style={s.planName}>{p.name}</Text>
                      {p.badge ? (
                        <View style={[s.badge, { backgroundColor: c.ink }]}>
                          <Text style={[s.badgeText, { color: c.obsidian }]}>{p.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.planBlurb}>{p.blurb}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.price}>{p.price}</Text>
                    <Text style={s.cadence}>{p.cadence}</Text>
                  </View>
                </View>
              </PressableScale>
            </Reveal>
          );
        })}
      </View>

      {/* Features */}
      <Reveal delay={260} style={{ marginTop: 22 }}>
        <Text style={[s.everything, { color: c.inkFaint }]}>EVERYTHING IN PRO</Text>
        <View style={{ marginTop: 12 }}>{PRO_FEATURES.map((f, i) => <FeatureRow key={i} c={c} text={f} />)}</View>
      </Reveal>

      {/* CTA */}
      <Reveal delay={320} style={{ marginTop: 24 }}>
        <PressableScale style={[s.cta, { backgroundColor: c.ink }]} onPress={checkout} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={c.obsidian} />
          ) : (
            <>
              <Text style={[s.ctaText, { color: c.obsidian }]}>
                {plan.id === "lifetime" ? `Get Lifetime · ${plan.price}` : `Start ${TRIAL_DAYS}-day free trial`}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={c.obsidian} />
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
          Secure checkout by Stripe.{" "}
          {plan.id === "monthly" ? `No charge for ${TRIAL_DAYS} days — cancel anytime.` : "One payment, no subscription."}
        </Text>
        {!billingConfigured ? (
          <Text style={[s.fine, { color: c.inkFaint, marginTop: 4 }]}>
            (Set EXPO_PUBLIC_STRIPE_LIFETIME_URL / _MONTHLY_URL to enable purchases.)
          </Text>
        ) : null}
      </Reveal>
    </SubScreen>
  );
}

function FeatureRow({ c, text }: { c: Palette; text: string }) {
  return (
    <View style={feat.row}>
      <View style={[feat.tick, { borderColor: c.line, backgroundColor: c.fill }]}>
        <Ionicons name="checkmark" size={13} color={c.ink} />
      </View>
      <Text style={[feat.text, { color: c.ink }]}>{text}</Text>
    </View>
  );
}

const feat = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 7 },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  text: { fontFamily: fonts.body, fontSize: 14, flex: 1 },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    lead: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21 },
    trialBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12 },
    trialText: { fontFamily: fonts.body, fontSize: 14 },
    proof: { borderWidth: 1, borderRadius: radius.xl, padding: 18, alignItems: "center" },
    proofStat: { fontFamily: fonts.displayBold, fontSize: 40, letterSpacing: -1 },
    proofLine: { fontFamily: fonts.body, fontSize: 13.5, textAlign: "center", marginTop: 2, lineHeight: 19, maxWidth: 300 },
    stars: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 12 },
    proofRating: { fontFamily: fonts.mono, fontSize: 11.5 },
    plan: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
    planOn: { shadowColor: c.ink, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    planHead: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    planName: { fontFamily: fonts.display, fontSize: 17, color: c.ink },
    badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.3 },
    planBlurb: { fontFamily: fonts.body, fontSize: 12.5, color: c.inkMuted, marginTop: 3 },
    price: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink, letterSpacing: -0.5 },
    cadence: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint, marginTop: 1 },
    everything: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
    cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.pill, paddingVertical: 16, minHeight: 54 },
    ctaText: { fontFamily: fonts.bodyBold, fontSize: 15.5 },
    methods: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
    methodsText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
    fine: { fontFamily: fonts.body, fontSize: 11.5, textAlign: "center", marginTop: 10, lineHeight: 16 },
    proBox: { borderWidth: 1, borderRadius: radius.xl, padding: 22, alignItems: "center" },
    proIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    proTitle: { fontFamily: fonts.displayBold, fontSize: 19, color: c.ink, marginTop: 14 },
    proSub: { fontFamily: fonts.body, fontSize: 13.5, color: c.inkMuted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  });
