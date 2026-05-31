import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

// 1 credit = $0.01 (100 credits = $1.00)
export const CREDIT_PRICE_CENTS = 1;

/** Format credits as USD string: "$1.50" for 150 credits */
export function creditsToUSD(credits: number): string {
  return `$${(credits / 100).toFixed(2)}`;
}

/** Format credits with both USD and credit display */
export function formatCredits(credits: number): string {
  if (credits === 0) return "Free";
  return `${creditsToUSD(credits)} (${credits.toLocaleString()} credits)`;
}

export { getStripe };
