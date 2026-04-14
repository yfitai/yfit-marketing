/**
 * Stripe Income Sync Module
 * 
 * Pulls charges from Stripe API and stores them in the stripe_income table.
 * Converts USD to CAD using the Bank of Canada exchange rate API.
 * Handles refunds and calculates Stripe processing fees.
 */

import { getDb } from "./db";
import { stripeIncome, type StripeIncome } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const STRIPE_KEY = process.env.STRIPE_RESTRICTED_KEY!;
const STRIPE_API = "https://api.stripe.com/v1";

// Stripe processing fee: 2.9% + $0.30 CAD per transaction (standard rate)
const STRIPE_PERCENTAGE_FEE = 0.029;
const STRIPE_FIXED_FEE_CAD_CENTS = 42; // ~$0.30 USD converted to CAD cents

interface StripeCharge {
  id: string;
  amount: number; // in smallest currency unit (cents)
  currency: string;
  customer_email?: string;
  description?: string;
  status: string;
  refunded: boolean;
  amount_refunded: number;
  created: number; // Unix timestamp
  balance_transaction?: string;
}

interface StripeList<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  url: string;
}

/**
 * Fetch the USD to CAD exchange rate from the Bank of Canada API.
 * Falls back to a reasonable default if the API is unavailable.
 */
async function getUsdToCadRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1"
    );
    if (!res.ok) throw new Error("Bank of Canada API unavailable");
    const data = await res.json();
    const rate = data.observations?.[0]?.FXUSDCAD?.v;
    if (rate) return parseFloat(rate);
  } catch {
    console.warn("[StripeSync] Could not fetch BoC exchange rate, using fallback 1.37");
  }
  return 1.37; // Fallback rate
}

/**
 * Fetch all Stripe charges for a given month (UTC).
 */
async function fetchStripeChargesForMonth(year: number, month: number): Promise<StripeCharge[]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const startUnix = Math.floor(startDate.getTime() / 1000);
  const endUnix = Math.floor(endDate.getTime() / 1000);

  const charges: StripeCharge[] = [];
  let startingAfter: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "100",
      "created[gte]": startUnix.toString(),
      "created[lt]": endUnix.toString(),
    });
    if (startingAfter) params.set("starting_after", startingAfter);

    const res = await fetch(`${STRIPE_API}/charges?${params}`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Stripe API error: ${err.error?.message}`);
    }

    const list: StripeList<StripeCharge> = await res.json();
    charges.push(...list.data);

    if (list.has_more && list.data.length > 0) {
      startingAfter = list.data[list.data.length - 1].id;
    } else {
      break;
    }
  } while (true);

  return charges;
}

/**
 * Sync Stripe charges for a specific month into the database.
 * Returns a summary of what was synced.
 */
export async function syncStripeIncomeForMonth(
  year: number,
  month: number
): Promise<{
  synced: number;
  skipped: number;
  totalRevenueCadCents: number;
  totalGstCollectedCadCents: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const exchangeRate = await getUsdToCadRate();
  const charges = await fetchStripeChargesForMonth(year, month);

  let synced = 0;
  let skipped = 0;
  let totalRevenueCadCents = 0;
  let totalGstCollectedCadCents = 0;

  for (const charge of charges) {
    // Skip failed charges
    if (charge.status !== "succeeded") continue;

    // Check if already synced
    const existing = await db
      .select({ id: stripeIncome.id })
      .from(stripeIncome)
      .where(eq(stripeIncome.stripeChargeId, charge.id))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Convert USD cents to CAD cents
    const amountUsdCents = charge.amount;
    const amountCadCents = Math.round(amountUsdCents * exchangeRate);

    // Calculate Stripe fees in CAD cents
    const stripeFeesCadCents = Math.round(amountCadCents * STRIPE_PERCENTAGE_FEE) + STRIPE_FIXED_FEE_CAD_CENTS;

    // GST collected: YFIT charges in USD to international customers.
    // Manitoba GST (5%) is only collected on Canadian customers.
    // For now, set to 0 — user should enable Stripe Tax for automatic GST collection.
    // TODO: When Stripe Tax is enabled, read tax_amount from the payment_intent.
    const gstCollectedCadCents = 0;

    const refundAmountCadCents = charge.amount_refunded > 0
      ? Math.round(charge.amount_refunded * exchangeRate)
      : 0;

    await db.insert(stripeIncome).values({
      stripeChargeId: charge.id,
      amountUsdCents,
      amountCadCents,
      exchangeRate: exchangeRate.toFixed(6),
      gstCollectedCadCents,
      stripeFeesCadCents,
      currency: charge.currency,
      customerEmail: charge.customer_email ?? null,
      description: charge.description ?? null,
      status: charge.refunded ? "refunded" : "succeeded",
      refunded: charge.refunded,
      refundAmountCadCents,
      chargedAt: new Date(charge.created * 1000),
    });

    totalRevenueCadCents += amountCadCents - refundAmountCadCents;
    totalGstCollectedCadCents += gstCollectedCadCents;
    synced++;
  }

  console.log(`[StripeSync] ${year}-${String(month).padStart(2, "0")}: synced=${synced}, skipped=${skipped}`);
  return { synced, skipped, totalRevenueCadCents, totalGstCollectedCadCents };
}

/**
 * Get total Stripe income for a month from the database.
 */
export async function getStripeIncomeForMonth(year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(stripeIncome)
    .where(
      and(
        gte(stripeIncome.chargedAt, startDate),
        lte(stripeIncome.chargedAt, endDate)
      )
    );

  const grossRevenueCadCents = rows.reduce((sum: number, r: StripeIncome) => sum + r.amountCadCents, 0);
  const totalRefundsCadCents = rows.reduce((sum: number, r: StripeIncome) => sum + r.refundAmountCadCents, 0);
  const stripeFeesTotalCadCents = rows.reduce((sum: number, r: StripeIncome) => sum + r.stripeFeesCadCents, 0);
  const gstCollectedCadCents = rows.reduce((sum: number, r: StripeIncome) => sum + r.gstCollectedCadCents, 0);
  const netRevenueCadCents = grossRevenueCadCents - totalRefundsCadCents - stripeFeesTotalCadCents;

  return {
    rows,
    grossRevenueCadCents,
    totalRefundsCadCents,
    stripeFeesTotalCadCents,
    gstCollectedCadCents,
    netRevenueCadCents,
  };
}
