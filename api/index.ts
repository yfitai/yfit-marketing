import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Initialize Stripe
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

function getPriceIds() {
  return {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    proLifetime: process.env.STRIPE_PRICE_PRO_LIFETIME || "",
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const path = (req.query.path as string) || req.url || "";

  // POST /api/stripe/create-checkout-session
  if (req.method === "POST" && path.includes("create-checkout-session")) {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: "Payment processing not configured" });
    }

    const { plan, successUrl, cancelUrl } = req.body as {
      plan: "proMonthly" | "proYearly" | "proLifetime" | "freeTrial";
      successUrl?: string;
      cancelUrl?: string;
    };

    if (plan === "freeTrial") {
      return res.json({ url: process.env.APP_SIGNUP_URL || "https://yfitai.com/signup?trial=true" });
    }

    const priceIds = getPriceIds();
    const priceId = priceIds[plan as keyof typeof priceIds];
    if (!priceId) {
      return res.status(400).json({ error: `No price configured for plan: ${plan}` });
    }

    try {
      const isLifetime = plan === "proLifetime";
      const origin = (req.headers.origin as string) || "https://yfit-marketing.vercel.app";

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: isLifetime ? "payment" : "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${origin}/#pricing`,
        automatic_tax: { enabled: true },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        metadata: { plan, source: "yfit-marketing-website" },
      };

      if (!isLifetime) {
        sessionParams.subscription_data = {
          metadata: { plan },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return res.json({ url: session.url });
    } catch (error) {
      console.error("[Stripe] Error creating checkout session:", error);
      return res.status(500).json({ error: "Failed to create checkout session", details: String(error) });
    }
  }

  // POST /api/stripe/webhook
  if (req.method === "POST" && path.includes("webhook")) {
    const stripe = getStripe();
    if (!stripe) return res.status(503).send("Payment processing not configured");

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("[Stripe] STRIPE_WEBHOOK_SECRET not set");
      return res.json({ received: true });
    }

    try {
      const rawBody = JSON.stringify(req.body);
      const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      console.log(`[Stripe] Webhook: ${event.type}`);
      return res.json({ received: true });
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
  }

  // GET /api/stripe/plans
  if (req.method === "GET" && path.includes("plans")) {
    const stripe = getStripe();
    const priceIds = getPriceIds();
    return res.json({
      configured: !!stripe,
      plans: {
        proMonthly: { priceId: priceIds.proMonthly, amount: 1299, currency: "usd" },
        proYearly: { priceId: priceIds.proYearly, amount: 9999, currency: "usd" },
        proLifetime: { priceId: priceIds.proLifetime, amount: 24999, currency: "usd" },
      },
    });
  }

  return res.status(404).json({ error: "Not found" });
}
