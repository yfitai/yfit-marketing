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

// ─── AI Auto-Responder ────────────────────────────────────────────────────────
// Uses OpenAI GPT-4o-mini to generate an instant, personalised answer.
// Falls back gracefully to the generic acknowledgement if OpenAI is unavailable.

const YFIT_SYSTEM_PROMPT = `You are the YFIT AI support assistant. You answer questions about the YFIT AI fitness app in a friendly, helpful, and easy-to-understand way (7th-grade reading level). Keep answers concise — 2-4 short paragraphs maximum.

Key facts about YFIT AI:
- YFIT AI is an AI-powered personal fitness coach app available at app.yfitai.com
- Features: AI form analysis (camera-based real-time feedback), personalized workout plans, barcode nutrition scanning, medication tracking with interaction alerts, daily AI coaching, progress predictions
- Pricing: Free Basic (no card needed), Pro Monthly $12.99/month, Pro Yearly $99.99/year (Best Value, 35% off), Pro Lifetime $249.99 one-time (Most Popular). Limited-time: 1 free month of Pro.
- No gym or equipment required — works for home, gym, and outdoor workouts
- Supports all fitness levels from beginner to advanced
- Supports special diets: vegetarian, vegan, keto, paleo, gluten-free, and more
- Payments processed securely by Stripe (PCI-DSS Level 1)
- Cancel anytime, 30-day money-back guarantee on all Pro plans
- Data encrypted with AES-256, never sold to third parties
- Users can delete their account by emailing support@yfitai.com
- Support email: support@yfitai.com
- Website: yfitai.com
- FAQ: yfitai.com/faq

If the question is outside your knowledge or requires account-specific help, say so kindly and direct them to support@yfitai.com. Never make up information. Always end with "Stay strong, The YFIT AI Support Team".`;

async function generateAIResponse(
  subject: string,
  message: string,
  name: string
): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 400,
        temperature: 0.5,
        messages: [
          { role: "system", content: YFIT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Hi, my name is ${name}. Subject: ${subject}\n\n${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[AI] OpenAI error (${response.status}): ${errText}`);
      return null;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn("[AI] OpenAI call failed:", err);
    return null;
  }
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

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
      return { success: true, alreadyExists: true };
    }

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.warn(`[Waitlist] DB insert warning (${dbRes.status}): ${errText}`);
    } else {
      console.log(`[Waitlist] Saved ${email} to database`);
    }
  } catch (dbErr) {
    console.warn("[Waitlist] DB error (continuing to send email):", dbErr);
  }

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
                    <li style="margin: 10px 0;">Personalized nutrition tracking &amp; barcode scanner</li>
                    <li style="margin: 10px 0;">Smart medication tracking with interaction alerts</li>
                    <li style="margin: 10px 0;">Daily AI coaching &amp; progress predictions</li>
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

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  // POST /api/contact — AI-powered auto-responder
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
      // 1. Attempt AI-generated answer (non-blocking — falls back if unavailable)
      const aiAnswer = await generateAIResponse(subject, message, name);
      const hasAiAnswer = !!aiAnswer;

      // 2. Send notification email to support@yfitai.com
      const aiStatusBadge = hasAiAnswer
        ? `<span style="background:#10b981;color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">✅ AI auto-replied</span>`
        : `<span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">⏳ Needs human reply</span>`;

      const supportHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 24px 30px;">
                <h2 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission ${aiStatusBadge}</h2>
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
                ${hasAiAnswer ? `
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <h3 style="color: #374151; margin-top: 0;">🤖 AI Auto-Reply Sent:</h3>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                  <p style="color: #374151; margin: 0; white-space: pre-wrap;">${aiAnswer}</p>
                </div>
                ` : ""}
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
          subject: `[Contact Form${hasAiAnswer ? " — AI replied" : " — needs reply"}] ${subject}`,
          html: supportHtml,
        }),
      });

      if (!supportRes.ok) {
        const errText = await supportRes.text();
        console.error(`[Contact] Failed to send support notification (${supportRes.status}): ${errText}`);
        return res.status(500).json({ error: "Failed to send message. Please try again." });
      }

      // 3. Send reply to user — AI answer if available, otherwise generic acknowledgement
      const userHtml = hasAiAnswer ? `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 26px;">Here's Your Answer! 🤖</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}! 👋</h2>
                <p style="font-size: 15px; color: #4b5563;">
                  Thanks for reaching out to YFIT AI. Our AI support assistant has reviewed your question and has an answer for you right now:
                </p>
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px 24px; margin: 24px 0; border-radius: 8px;">
                  <p style="margin: 0; font-weight: bold; color: #374151; margin-bottom: 8px;">Your question: <em style="font-weight:normal;color:#6b7280;">${subject}</em></p>
                  <hr style="border:none;border-top:1px solid #d1fae5;margin:12px 0;" />
                  <p style="margin: 0; color: #1f2937; white-space: pre-wrap; line-height: 1.7;">${aiAnswer}</p>
                </div>
                <p style="font-size: 14px; color: #6b7280;">
                  If this didn't fully answer your question, just reply to this email and a human support agent will follow up.
                  You can also browse our <a href="https://yfitai.com/faq" style="color:#3b82f6;">full FAQ</a> for more answers.
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
      ` : `
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
                  While you wait, you might find a quick answer in our <a href="https://yfitai.com/faq" style="color:#3b82f6;">FAQ</a>.
                </p>
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
          subject: hasAiAnswer
            ? `Re: ${subject} — YFIT AI Support`
            : "We received your message — YFIT AI Support",
          html: userHtml,
        }),
      });

      // 4. Log submission to Supabase contact_submissions table
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        try {
          const logRes = await fetch(`${supabaseUrl}/rest/v1/contact_submissions`, {
            method: "POST",
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              name,
              email,
              subject: subject || null,
              message,
              ai_answer: aiAnswer || null,
              ai_answered: hasAiAnswer,
            }),
          });

          if (logRes.ok) {
            console.log(`[Contact] Logged to Supabase — AI answered: ${hasAiAnswer}`);
          } else {
            const errText = await logRes.text();
            console.warn(`[Contact] Supabase log failed (${logRes.status}): ${errText}`);
          }
        } catch (logErr) {
          console.warn("[Contact] Supabase logging error (non-fatal):", logErr);
        }
      } else {
        console.warn("[Contact] Supabase not configured — skipping log");
      }

      console.log(`[Contact] Message from ${email} — AI answered: ${hasAiAnswer}`);
      return res.json({ success: true, message: "Message sent successfully", aiAnswered: hasAiAnswer });
    } catch (err) {
      console.error("[Contact] Error:", err);
      return res.status(500).json({ error: "Failed to send message. Please try again." });
    }
  }

  return res.status(404).json({ error: "Not found" });
}
