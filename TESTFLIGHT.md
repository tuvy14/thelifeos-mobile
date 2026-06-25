# Ship TheLifeOS to TestFlight

A first internal build, start to finish. Bundle id is `com.thelifeos.app`.
EAS manages signing + build numbers, so you don't touch certificates by hand.

> **Credential boundary:** the App Store Connect API key (`.p8`), signing
> certs, and any app-specific passwords go straight into EAS / your machine —
> never paste them into chat. For this first build, an interactive Apple ID
> login is all you need; no API key required.

---

## 0. One-time prerequisites

1. **Expo account** — sign up free at https://expo.dev.
2. **EAS CLI**:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Apple Developer account** — already approved ✓.

## 1. Link the project to EAS (one-time)

From the `lifeos-mobile` folder:
```bash
eas init
```
This creates/links an Expo project and writes its id into `app.json`. Commit that change.

## 2. Set the build-time env vars on EAS

The cloud build doesn't see your `.env.local` (it's gitignored), so set the
**public** Supabase keys as EAS env vars (the anon key is a public client key —
plaintext is fine):

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL      --value "<your supabase url>"      --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your anon key>"          --visibility plaintext
```
(Or set them in the Expo dashboard → your project → **Environment variables**.)
Add `EXPO_PUBLIC_RC_IOS_KEY` later, once RevenueCat/IAP is set up — it's not
needed for this first build.

## 3. Build the iOS app

```bash
eas build --platform ios --profile production
```
EAS will prompt to **log in with your Apple ID**, then auto-register the App ID
`com.thelifeos.app` and generate the provisioning profile + distribution
certificate. Say yes to the prompts. The cloud build takes ~15–25 min and
produces an `.ipa`.

## 4. Create the App Store Connect app record

If `eas submit` doesn't offer to create it, do it manually at
https://appstoreconnect.apple.com → **Apps → ➕ → New App**:
- Platform **iOS**, Name **TheLifeOS**, Bundle ID **com.thelifeos.app**
- SKU: e.g. `thelifeos-ios`, Primary language: English.

## 5. Submit to TestFlight

```bash
eas submit --platform ios --latest
```
Choose **Apple ID** auth for this first one. EAS uploads the build; App Store
Connect then "processes" it (~5–15 min). Encryption compliance is pre-answered
(`ITSAppUsesNonExemptEncryption: false` in `app.json`), so no prompt.

## 6. Install via TestFlight

1. App Store Connect → your app → **TestFlight** tab → wait for the build to
   leave "Processing."
2. Add yourself under **Internal Testing** (internal testers need no Beta App
   Review; external testers do).
3. On your iPhone: install the **TestFlight** app, accept the invite, install
   the build.

Re-shipping later is just steps 3 + 5 again (`eas build` → `eas submit`); the
build number auto-increments.

---

## Later: In-App Purchases on TestFlight

To test purchases (Pro $15/mo, Lifetime $300) you'll additionally need:
- **Paid Applications Agreement** signed + banking/tax in App Store Connect
  (App Store Connect → Business). Until it's *Active*, RevenueCat returns no
  offerings and purchases fail — even in sandbox.
- IAP products created in App Store Connect and wired to RevenueCat
  (entitlement `pro`; Offering with **Monthly** + **Lifetime** packages — the
  app keys off those, see `src/lib/iap.ts`).
- `EXPO_PUBLIC_RC_IOS_KEY` (your public `appl_…` key) set as an EAS env var.
- A **Sandbox tester** account (Users and Access → Sandbox).

## Non-secret IDs you can share so I can wire `eas.json` for non-interactive submits later
- **Apple Team ID** (developer.apple.com → Membership, 10 chars).
- The app's numeric **Apple ID** (App Store Connect → your app → App Information).
