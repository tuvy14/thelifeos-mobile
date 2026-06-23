import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, REFERRAL_PERCENT, REFERRAL_MONTHLY, REFERRAL_DISCOUNT } from "@/lib/store";

export default function ReferralsScreen() {
  const { referrals, refCode, ensureRefCode, addReferral } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const [name, setName] = useState("");

  useEffect(() => { ensureRefCode(); }, [ensureRefCode]);

  const subscribed = referrals.filter((r) => r.status === "subscribed");
  const monthly = subscribed.reduce((a, r) => a + r.monthlyEarn, 0);
  const stats = [
    { label: "Invited", value: String(referrals.length) },
    { label: "Subscribed", value: String(subscribed.length) },
    { label: "Earning · mo", value: `$${monthly}` },
  ];

  const invite = () => { if (!name.trim()) return; addReferral(name); setName(""); };

  return (
    <SubScreen eyebrow="Refer & earn" title="Invite friends">
      <Text style={s.sub}>
        Friends get ${REFERRAL_DISCOUNT} off their first month. You earn {REFERRAL_PERCENT}% — about ${REFERRAL_MONTHLY}/mo — for every friend who stays on Pro.
      </Text>

      <Card style={{ marginTop: 16, alignItems: "center" }}>
        <Text style={s.codeLabel}>YOUR INVITE CODE</Text>
        <Text style={s.code}>{refCode || "…"}</Text>
        <Text style={s.codeHint}>Share it — they save, you earn.</Text>
      </Card>

      <View style={s.statRow}>
        {stats.map((st) => (
          <Card key={st.label} style={{ flex: 1 }} padding={14}>
            <Text style={s.statVal}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </Card>
        ))}
      </View>

      <Card style={{ marginTop: 14 }}>
        <Text style={s.formLabel}>ADD A FRIEND YOU&apos;VE INVITED</Text>
        <View style={s.formRow}>
          <TextInput value={name} onChangeText={setName} placeholder="Friend's name" placeholderTextColor={c.inkFaint} style={[s.input, { borderColor: c.line, backgroundColor: c.fill }]} returnKeyType="done" onSubmitEditing={invite} />
          <Pressable style={[s.addBtn, { backgroundColor: c.ink }]} onPress={invite}>
            <Ionicons name="add" size={20} color={c.obsidian} />
          </Pressable>
        </View>
      </Card>

      {referrals.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="gift-outline" text="No invites yet. Add a friend you've referred to track it." />
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 8 }}>
          {referrals.map((r) => (
            <View key={r.id} style={[s.item, { borderColor: c.line, backgroundColor: c.card }]}>
              <View style={[s.avatar, { backgroundColor: c.fill, borderColor: c.line }]}>
                <Text style={s.avatarText}>{r.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.name}</Text>
                <Text style={s.joined}>Joined {r.joined}</Text>
              </View>
              <View style={[s.status, { borderColor: c.line, backgroundColor: r.status === "subscribed" ? c.ink : "transparent" }]}>
                <Text style={[s.statusText, { color: r.status === "subscribed" ? c.obsidian : c.inkMuted }]}>{r.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4, lineHeight: 19 },
    codeLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: c.inkFaint },
    code: { fontFamily: fonts.displayBold, fontSize: 30, color: c.ink, letterSpacing: 1, marginTop: 8 },
    codeHint: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted, marginTop: 6 },
    statRow: { flexDirection: "row", gap: 10, marginTop: 14 },
    statVal: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint, marginTop: 2 },
    formLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, color: c.inkFaint, marginBottom: 12 },
    formRow: { flexDirection: "row", gap: 8 },
    input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    addBtn: { width: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
    item: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11 },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    avatarText: { fontFamily: fonts.displayBold, fontSize: 15, color: c.ink },
    name: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink },
    joined: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint, marginTop: 2 },
    status: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontFamily: fonts.bodyMedium, fontSize: 11, textTransform: "capitalize" },
  });
