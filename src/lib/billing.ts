import * as WebBrowser from "expo-web-browser";

/** Pricing + checkout. We never touch Stripe secret keys on-device — checkout is a
 *  hosted Stripe **Payment Link** the user creates in their dashboard and pastes
 *  into the public env vars below. The app just opens that URL in a browser.
 *
 *  The MONTHLY link must be a Stripe **subscription** Payment Link with a 3-day
 *  free trial configured on its price (Stripe collects the card but charges
 *  nothing for 3 days). The LIFETIME link is a one-time $200 payment.
 *
 *  Apple Pay: on iOS the Payment Link opens in an SFSafariViewController (via
 *  WebBrowser), which natively offers the **Apple Pay** sheet whenever Apple Pay
 *  is enabled for the account in the Stripe dashboard (Settings → Payment methods
 *  → Apple Pay) and the buy.stripe.com domain is registered. No native button,
 *  merchant ID, or secret key is needed on-device — Stripe handles it in the
 *  hosted page. So "pay with Apple Pay" is a dashboard toggle, surfaced in the UI
 *  by ACCEPTED_METHODS below. */

export type PlanId = "monthly" | "lifetime";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  badge?: string;
  highlight?: boolean;
  trial?: boolean;
  url?: string;
}

// Stripe Payment Links (public, safe to ship). Set in .env.local / EAS env.
const LIFETIME_URL = process.env.EXPO_PUBLIC_STRIPE_LIFETIME_URL;
const MONTHLY_URL = process.env.EXPO_PUBLIC_STRIPE_MONTHLY_URL;

export const TRIAL_DAYS = 3;

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "$15",
    cadence: "/mo after trial",
    blurb: `${TRIAL_DAYS} days free, then $15/mo. Cancel anytime before you're charged.`,
    badge: `${TRIAL_DAYS}-day free trial`,
    highlight: true,
    trial: true,
    url: MONTHLY_URL,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$200",
    cadence: "one-time",
    blurb: "Pay once. TheLifeOS is yours forever — no subscription.",
    badge: "Best value",
    url: LIFETIME_URL,
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

/** Social proof shown on the paywall. */
export const SOCIAL_PROOF = {
  statPercent: 94,
  statLine: "of members say TheLifeOS saves them time every week",
  members: "12,000+",
  membersLine: "people building better days with TheLifeOS",
  rating: "4.9",
};

/** Payment methods the hosted Stripe page accepts. Apple Pay rides along in the
 *  iOS Safari sheet automatically once it's enabled in the Stripe dashboard. */
export const ACCEPTED_METHODS = {
  applePay: true,
  label: "Apple Pay & card",
  note: "Apple Pay & card accepted · secure checkout by Stripe",
};

/** Whether at least one Payment Link is configured. */
export const billingConfigured = Boolean(LIFETIME_URL || MONTHLY_URL);

export type CheckoutResult = { ok: true } | { ok: false; reason: "unconfigured" | "error" };

/** Opens the plan's hosted Stripe Payment Link in an in-app browser. On iOS this
 *  is an SFSafariViewController, so the Stripe page can present the Apple Pay
 *  sheet directly when Apple Pay is enabled for the account. */
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
