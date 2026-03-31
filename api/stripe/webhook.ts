import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Disable Vercel's default body parser so we get the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2024-06-20" as any });
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error("[Stripe Webhook] STRIPE_SECRET_KEY not configured");
    return res.status(503).send("Payment processing not configured");
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // No webhook secret set — accept the event but log a warning
    console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
    return res.status(200).json({ received: true });
  }

  let rawBody: Buffer;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error("[Stripe Webhook] Failed to read raw body:", err);
    return res.status(400).send("Failed to read request body");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] Checkout completed: session=${session.id}, plan=${session.metadata?.plan}, customer=${session.customer}`);
      // TODO: Provision user access in the YFIT app database
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription ${event.type}: id=${subscription.id}, status=${subscription.status}`);
      // TODO: Update subscription status in database
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription cancelled: id=${subscription.id}`);
      // TODO: Revoke user access in database
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Payment failed: invoice=${invoice.id}, customer=${invoice.customer}`);
      // TODO: Notify user of payment failure
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] Payment succeeded: invoice=${invoice.id}, amount=${invoice.amount_paid}`);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
