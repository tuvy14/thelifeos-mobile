import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { SubScreen } from "@/components/sub-screen";
import { Reveal, PressableScale } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore } from "@/lib/store";
import { useCelebrate } from "@/lib/celebrate";
import { PLANS, PRO_FEATURES, openCheckout, billingConfigured, type Plan } from "@/lib/billing";

export default function UpgradeScreen() {
  const { c } = useTheme();
  const s = makeStyles(c);
  const { profile } = useStore();
  const { celebrate } = useCelebrate();
  const [selected, setSelected] = useState<Plan["id"]>("lifetime");
  const [busy, setBusy] = useState(false);

  const isPro = !!profile?.admin; // admin accounts are Pro forever
  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[0];

  const pick = (id: Plan["id"]) => {
    try { Haptics.selectionAsync(); } catch { /* ignore */ }
    setSelected(id);
  };

  const checkout = async () => {
    if (busy) return;
    setBusy(true);
    const res = await openCheckout(plan);
    setBusy(false);
    if (!res.ok && res.reason === "unconfigured") {
      celebrate("Checkout isn't set up yet — add your Stripe Payment Link.");
    }
  };

  if (isPro) {
    return (
      <SubScreen eyebrow="TheLifeOS Pro" title="You're all in">
        <View style={[s.proBox, { borderColor: c.line, backgroundColor: c.card }]}>
          <View style={[s.proIcon, { backgroundColor: c.ink }]}>
            <Ionicons name="checkmark" size={22} color={c.obsidian} />
          </View>
          <Text style={s.proTitle}>Pro is active</Text>
          <Text style={s.proSub}>You have lifetime access to every tool, mode and future update. Thank you for backing TheLifeOS.</Text>
        </View>
        <View style={{ marginTop: 18 }}>{PRO_FEATURES.map((f, i) => <FeatureRow key={i} c={c} text={f} />)}</View>
      </SubScreen>
    );
  }

  return (
    <SubScreen eyebrow="TheLifeOS Pro" title="Unlock everything">
      <Text style={[s.lead, { color: c.inkMuted }]}>
        One calm place for your whole life. Go Pro to sync everywhere and unlock every focus mode.
      </Text>

      {/* Plan selector */}
      <View style={{ marginTop: 20, gap: 12 }}>
        {PLANS.map((p, i) => {
          const on = p.id === selected;
          return (
            <Reveal key={p.id} delay={i * 80}>
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
      <Reveal delay={220} style={{ marginTop: 22 }}>
        <Text style={[s.everything, { color: c.inkFaint }]}>EVERYTHING IN PRO</Text>
        <View style={{ marginTop: 12 }}>{PRO_FEATURES.map((f, i) => <FeatureRow key={i} c={c} text={f} />)}</View>
      </Reveal>

      {/* CTA */}
      <Reveal delay={300} style={{ marginTop: 24 }}>
        <PressableScale style={[s.cta, { backgroundColor: c.ink }]} onPress={checkout} disabled={busy}>
          <Text style={[s.ctaText, { color: c.obsidian }]}>
            {plan.id === "lifetime" ? `Get Lifetime · ${plan.price}` : `Start ${plan.name} · ${plan.price}/mo`}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={c.obsidian} />
        </PressableScale>
        <Text style={[s.fine, { color: c.inkFaint }]}>
          Secure checkout by Stripe. {plan.id === "monthly" ? "Cancel anytime." : "One payment, no subscription."}
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
    plan: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
    planOn: { shadowColor: c.ink, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    planHead: { flexDirection: "row", alignItems: "center", gap: 8 },
    planName: { fontFamily: fonts.display, fontSize: 17, color: c.ink },
    badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.3 },
    planBlurb: { fontFamily: fonts.body, fontSize: 12.5, color: c.inkMuted, marginTop: 3 },
    price: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink, letterSpacing: -0.5 },
    cadence: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint, marginTop: 1 },
    everything: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
    cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.pill, paddingVertical: 16 },
    ctaText: { fontFamily: fonts.bodyBold, fontSize: 15.5 },
    fine: { fontFamily: fonts.body, fontSize: 11.5, textAlign: "center", marginTop: 10 },
    proBox: { borderWidth: 1, borderRadius: radius.xl, padding: 22, alignItems: "center" },
    proIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    proTitle: { fontFamily: fonts.displayBold, fontSize: 19, color: c.ink, marginTop: 14 },
    proSub: { fontFamily: fonts.body, fontSize: 13.5, color: c.inkMuted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  });
