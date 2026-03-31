import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

// Initialize Stripe
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2024-06-20" as any });
}

function getPriceIds() {
  return {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    proLifetime: process.env.STRIPE_PRICE_PRO_LIFETIME || "",
  };
}

// Save waitlist entry to Supabase and send welcome email via Resend
async function handleWaitlistSignup(
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Waitlist] Supabase not configured");
    return { success: false, error: "Database not configured" };
  }

  // 1. Save to Supabase waitlist table
  try {
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName || null,
        source: "marketing-website",
        created_at: new Date().toISOString(),
      }),
    });

    if (dbRes.status === 409) {
      // Duplicate email — already on waitlist
      console.log(`[Waitlist] ${email} already on waitlist`);
      return { success: true, alreadyExists: true };
    }

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      // If table doesn't exist yet, log but continue to send email
      console.warn(`[Waitlist] DB insert warning (${dbRes.status}): ${errText}`);
    } else {
      console.log(`[Waitlist] Saved ${email} to database`);
    }
  } catch (dbErr) {
    console.warn("[Waitlist] DB error (continuing to send email):", dbErr);
  }

  // 2. Send welcome email via Resend directly (fallback if Supabase edge function not available)
  if (resendKey) {
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">You're on the YFIT Waitlist! 🎉</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName}! 👋</h2>
                <p style="font-size: 16px; color: #4b5563; margin: 20px 0;">
                  You're officially on the YFIT AI waitlist. We'll notify you the moment early access opens — and you'll be among the first to experience AI-powered fitness coaching.
                </p>
                <div style="background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                  <h3 style="margin-top: 0; color: #1f2937;">🚀 What's Coming Your Way:</h3>
                  <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
                    <li style="margin: 10px 0;">AI-powered workout form analysis</li>
                    <li style="margin: 10px 0;">Personalized nutrition tracking & barcode scanner</li>
                    <li style="margin: 10px 0;">Smart medication tracking with interaction alerts</li>
                    <li style="margin: 10px 0;">Daily AI coaching & progress predictions</li>
                  </ul>
                </div>
                <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 20px; border-radius: 12px; margin: 30px 0;">
                  <h3 style="color: white; margin-top: 0;">🎁 As an Early Waitlist Member:</h3>
                  <ul style="color: white; margin: 10px 0; padding-left: 20px;">
                    <li style="margin: 8px 0;">✅ Priority early access</li>
                    <li style="margin: 8px 0;">✅ Exclusive launch pricing</li>
                    <li style="margin: 8px 0;">✅ Founder's Badge in the app</li>
                    <li style="margin: 8px 0;">✅ Direct line to the dev team</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 40px 0;">
                  <a href="https://yfitai.com" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                    Learn More at yfitai.com →
                  </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 10px 0;">
                  Stay strong,<br/><strong>The YFIT AI Team</strong>
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">YFIT AI - Your Personal Fitness Coach</p>
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                  <a href="https://yfitai.com" style="color: #3b82f6; text-decoration: none;">yfitai.com</a> | 
                  <a href="mailto:support@yfitai.com" style="color: #3b82f6; text-decoration: none;">support@yfitai.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "YFIT AI <support@yfitai.com>",
          to: [email],
          subject: "You're on the YFIT AI Waitlist! 🎉",
          html,
        }),
      });

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        console.log(`[Waitlist] Welcome email sent to ${email} (id: ${emailData.id})`);
      } else {
        const errText = await emailRes.text();
        console.warn(`[Waitlist] Email send failed (${emailRes.status}): ${errText}`);
      }
    } catch (emailErr) {
      console.warn("[Waitlist] Email error:", emailErr);
    }
  }

  return { success: true };
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

  // POST /api/waitlist/signup
  if (req.method === "POST" && path.includes("waitlist")) {
    const { email, firstName, lastName } = req.body as {
      email: string;
      firstName: string;
      lastName?: string;
    };

    if (!email || !firstName) {
      return res.status(400).json({ error: "Email and first name are required" });
    }

    const result = await handleWaitlistSignup(email, firstName, lastName || "");

    if (result.alreadyExists) {
      return res.json({ success: true, message: "You're already on the waitlist! Check your inbox." });
    }

    if (!result.success) {
      return res.status(500).json({ error: result.error || "Failed to join waitlist" });
    }

    return res.json({ success: true, message: "Successfully joined waitlist" });
  }

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

  // POST /api/contact
  if (req.method === "POST" && path.includes("contact")) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return res.status(503).json({ error: "Email service not configured" });
    }

    const { name, email, subject, message } = req.body as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      // 1. Send notification email to support@yfitai.com
      const supportHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 24px 30px;">
                <h2 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h2>
              </div>
              <div style="padding: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: bold; width: 100px; color: #374151;">From:</td><td style="padding: 8px 0; color: #4b5563;">${name} &lt;${email}&gt;</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td><td style="padding: 8px 0; color: #4b5563;">${subject}</td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <h3 style="color: #374151; margin-top: 0;">Message:</h3>
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <p style="color: #4b5563; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                <p style="margin-top: 20px; font-size: 13px; color: #9ca3af;">Reply directly to this email to respond to ${name}.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const supportRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "YFIT AI Contact Form <support@yfitai.com>",
          to: ["support@yfitai.com"],
          reply_to: email,
          subject: `[Contact Form] ${subject}`,
          html: supportHtml,
        }),
      });

      if (!supportRes.ok) {
        const errText = await supportRes.text();
        console.error(`[Contact] Failed to send support notification (${supportRes.status}): ${errText}`);
        return res.status(500).json({ error: "Failed to send message. Please try again." });
      }

      // 2. Send automated acknowledgement to the user
      const userHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 26px;">We Got Your Message! ✅</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}! 👋</h2>
                <p style="font-size: 16px; color: #4b5563;">
                  Thanks for reaching out to YFIT AI. We received your message and will get back to you within <strong>4–6 hours</strong> (usually sooner!).
                </p>
                <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                  <p style="margin: 0; font-weight: bold; color: #374151;">Your message:</p>
                  <p style="margin: 8px 0 0; color: #6b7280; font-style: italic; white-space: pre-wrap;">${message}</p>
                </div>
                <p style="font-size: 15px; color: #4b5563;">
                  While you wait, you might find a quick answer in our FAQ:
                </p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://app.yfitai.com/faq" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Browse the FAQ →</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">
                  Stay strong,<br/><strong>The YFIT AI Support Team</strong>
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">YFIT AI — Your Personal Fitness Coach</p>
                <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">
                  <a href="https://yfitai.com" style="color: #3b82f6; text-decoration: none;">yfitai.com</a> | 
                  <a href="mailto:support@yfitai.com" style="color: #3b82f6; text-decoration: none;">support@yfitai.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "YFIT AI Support <support@yfitai.com>",
          to: [email],
          subject: "We received your message — YFIT AI Support",
          html: userHtml,
        }),
      });

      console.log(`[Contact] Message from ${email} forwarded to support@yfitai.com`);
      return res.json({ success: true, message: "Message sent successfully" });
    } catch (err) {
      console.error("[Contact] Error:", err);
      return res.status(500).json({ error: "Failed to send message. Please try again." });
    }
  }

  return res.status(404).json({ error: "Not found" });
}
