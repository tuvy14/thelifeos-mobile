import Constants from "expo-constants";
import { Platform } from "react-native";

import type {
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases";
import type { PlanId } from "./billing";

export type { CustomerInfo } from "react-native-purchases";

/** StoreKit In-App Purchase, via RevenueCat.
 *
 *  Apple requires IAP (StoreKit) to unlock digital features in an iOS app —
 *  Stripe is for the website only. RevenueCat is the native module behind this.
 *
 *  It does NOT exist in Expo Go, so the SDK is **lazily required** and every call
 *  is guarded: in Expo Go / on web `iapAvailable` is false and callers fall back
 *  to the Stripe flow. IAP only activates in a dev/production native build that
 *  has EXPO_PUBLIC_RC_IOS_KEY set.
 *
 *  RevenueCat dashboard must define (identifiers the app expects):
 *    • Entitlement id:  "pro"
 *    • The current Offering with two packages:
 *        – Monthly  → a subscription product (add a 3-day free intro offer in
 *                     App Store Connect)
 *        – Lifetime → a non-consumable product
 *  Put the **public** iOS SDK key (appl_…) in EXPO_PUBLIC_RC_IOS_KEY. */

export const PRO_ENTITLEMENT = "pro";

const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";
const RC_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  default: undefined,
});

/** True only in a real native build with a configured RevenueCat key. */
export const iapAvailable = !IS_EXPO_GO && Platform.OS !== "web" && Boolean(RC_KEY);

// Lazily pull in the native module — only off Expo Go/web, so importing it never
// crashes the JS bundle where the native side is absent.
type RNPurchases = typeof import("react-native-purchases");
let mod: RNPurchases | null = null;
function load(): RNPurchases | null {
  if (mod) return mod;
  if (!iapAvailable) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("react-native-purchases") as RNPurchases;
    return mod;
  } catch {
    return null;
  }
}

let configured = false;
export async function initIAP(appUserId?: string): Promise<void> {
  const m = load();
  if (!m || configured) return;
  try {
    if (__DEV__) m.default.setLogLevel(m.LOG_LEVEL.WARN);
    m.default.configure({ apiKey: RC_KEY as string, appUserID: appUserId });
    configured = true;
  } catch {
    /* stays unconfigured → callers fall back */
  }
}

/** Is the "pro" entitlement currently active on this CustomerInfo? */
export function hasPro(info: CustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements.active[PRO_ENTITLEMENT]);
}

/** Map the active entitlement to our local plan shape. A never-expiring,
 *  non-renewing entitlement is the Lifetime purchase; anything else is monthly. */
export function planFromInfo(info: CustomerInfo | null | undefined): "monthly" | "lifetime" | null {
  const ent = info?.entitlements.active[PRO_ENTITLEMENT];
  if (!ent) return null;
  if (!ent.willRenew && !ent.expirationDate) return "lifetime";
  return "monthly";
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const m = load();
  if (!m || !configured) return null;
  try {
    return await m.default.getCustomerInfo();
  } catch {
    return null;
  }
}

async function packageFor(m: RNPurchases, plan: PlanId): Promise<PurchasesPackage | null> {
  const offerings = await m.default.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  const want = plan === "lifetime" ? m.PACKAGE_TYPE.LIFETIME : m.PACKAGE_TYPE.MONTHLY;
  return pkgs.find((p) => p.packageType === want) ?? null;
}

export type PurchaseOutcome =
  | { status: "ok"; info: CustomerInfo }
  | { status: "cancelled" }
  | { status: "unavailable" }
  | { status: "error"; message: string };

/** Launch the native StoreKit purchase sheet for a plan. */
export async function purchasePlan(plan: PlanId): Promise<PurchaseOutcome> {
  const m = load();
  if (!m || !configured) return { status: "unavailable" };
  try {
    const pkg = await packageFor(m, plan);
    if (!pkg) return { status: "unavailable" };
    const { customerInfo } = await m.default.purchasePackage(pkg);
    return { status: "ok", info: customerInfo };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) return { status: "cancelled" };
    return { status: "error", message: err?.message || "Purchase failed." };
  }
}

/** Restore prior purchases from the signed-in App Store account (App Review
 *  requires this affordance for non-consumables / subscriptions). */
export async function restorePurchases(): Promise<PurchaseOutcome> {
  const m = load();
  if (!m || !configured) return { status: "unavailable" };
  try {
    const info = await m.default.restorePurchases();
    return { status: "ok", info };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { status: "error", message: err?.message || "Restore failed." };
  }
}

/** Subscribe to entitlement changes (purchases, renewals, restores). Returns an
 *  unsubscribe fn. No-op when IAP isn't available. */
export function onCustomerInfo(cb: (info: CustomerInfo) => void): () => void {
  const m = load();
  if (!m) return () => {};
  m.default.addCustomerInfoUpdateListener(cb);
  return () => {
    try {
      m.default.removeCustomerInfoUpdateListener(cb);
    } catch {
      /* ignore */
    }
  };
}
