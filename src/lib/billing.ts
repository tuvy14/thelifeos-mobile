import * as WebBrowser from "expo-web-browser";

/** Pricing + checkout. We never touch Stripe secret keys on-device — checkout is a
 *  hosted Stripe **Payment Link** the user creates in their dashboard and pastes
 *  into the public env vars below. The app just opens that URL in a browser. */

export type PlanId = "lifetime" | "monthly";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  badge?: string;
  highlight?: boolean;
  url?: string;
}

// Stripe Payment Links (public, safe to ship). Set in .env.local / EAS env.
const LIFETIME_URL = process.env.EXPO_PUBLIC_STRIPE_LIFETIME_URL;
const MONTHLY_URL = process.env.EXPO_PUBLIC_STRIPE_MONTHLY_URL;

export const PLANS: Plan[] = [
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$300",
    cadence: "one-time",
    blurb: "Pay once. TheLifeOS is yours forever.",
    badge: "Best value",
    highlight: true,
    url: LIFETIME_URL,
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$20",
    cadence: "per month",
    blurb: "Stay flexible — cancel anytime.",
    url: MONTHLY_URL,
  },
];

export const PRO_FEATURES = [
  "Unlimited cloud sync across all your devices",
  "Every focus mode & tool unlocked",
  "Advanced insights, trends & forecasts",
  "Otto AI coach — unlimited conversations",
  "Priority support",
  "All future updates included",
];

/** Whether at least one Payment Link is configured. */
export const billingConfigured = Boolean(LIFETIME_URL || MONTHLY_URL);

export type CheckoutResult = { ok: true } | { ok: false; reason: "unconfigured" | "error" };

/** Opens the plan's hosted Stripe Payment Link in an in-app browser. */
export async function openCheckout(plan: Plan): Promise<CheckoutResult> {
  if (!plan.url) return { ok: false, reason: "unconfigured" };
  try {
    await WebBrowser.openBrowserAsync(plan.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      dismissButtonStyle: "close",
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
