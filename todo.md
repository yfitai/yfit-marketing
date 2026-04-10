# YFIT Marketing Website TODO

## Core Website Features
- [x] Fix CSS animation issue (animate-gradient)
- [x] Resolve Home.tsx conflict from template upgrade
- [x] Add prominent Medication Tracking feature section
- [x] Add prominent Form Analysis feature section
- [x] Hero section with glassmorphism design
- [x] Features grid showcasing AI capabilities
- [x] Pricing section with 4 tiers (Free, Pro Monthly $12.99, Pro Yearly $99.99, Lifetime $249.99)
- [x] "Launch App" button linking to https://yfit-deploy.vercel.app
- [x] Limited-time offer banner (First Month Free)
- [x] Responsive mobile design
- [x] Footer with links

## Stripe Integration
- [ ] Add Stripe feature to project
- [ ] Set up payment processing for subscription tiers
- [ ] Implement refund handling
- [ ] Configure beta testing tier
- [ ] Test payment flows

## Social Media Automation (Future Phase)
- [ ] Integrate Pictory API for video generation
- [ ] Build content scraping system (WebMD, Mayo Clinic, etc.)
- [ ] Create posting automation for 6 platforms
- [ ] Implement analytics for engagement tracking
- [ ] Connect daily quotes to YFIT app

## Deployment
- [ ] Deploy to Vercel
- [ ] Configure yfitai.com to show marketing site first
- [ ] Test all links and functionality


## User-Requested Design Changes
- [x] Fix YFIT icon (integrated actual YFIT logo with motion lines)
- [x] Update pricing labels: Lifetime = "Most Popular", Yearly = "Best Value"
- [x] Change "AI Nutrition Scanner" to "Barcode Scanner"
- [x] Remove glass man avatar image
- [x] Lighten color scheme from deep blue-purple to blue-green
- [x] Add 8 Quick Action Cards section (Goals, Nutrition, Fitness, Daily Tracker, Medications, Progress, Predictions, AI Coach)
- [x] Update Medication card to mention "Provider Report" and interactions
- [x] Add personalization messaging throughout site
- [ ] Add form analysis video (waiting for user upload)

## March 2026 Session Updates
- [x] Restored project from backup after sandbox reset
- [x] Updated 8 feature cards with exact app colors (sourced from Dashboard.jsx)
- [x] Fixed 5 pricing cards with correct prices and BEST VALUE / MOST POPULAR badges
- [x] Created Sign In page (/signin)
- [x] Created Sign Up page (/signup)
- [x] Created Privacy Policy page (/privacy)
- [x] Created Terms of Service page (/terms)
- [x] Created Contact page with FAQ (/contact)
- [x] Fixed all navigation buttons to route to Sign In/Sign Up
- [x] Fixed footer links (no broken mailto links)
- [x] Removed "10,000 users" subscriber count
- [x] Added colored hero preview boxes matching feature card colors
- [x] Saved PRICING_CONFIG.md for future reference
- [ ] Stripe payment integration
- [x] Contact form email sending
- [ ] Final polish and publish

## March 24 2026 Session — Integration & Domain
- [x] Connect waitlist form to Supabase + Resend email system (send welcome email on signup)
- [x] Add waitlist entries to Supabase database table
- [x] Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel environment variables
- [x] Add RESEND_API_KEY to Vercel environment variables
- [x] Set up Stripe webhook endpoint for yfitai.com (https://yfitai.com/api/stripe/webhook)
- [x] Add STRIPE_WEBHOOK_SECRET to Vercel environment variables (whsec_rdcYlPNYh6WsGk0QycmFzdEqihyEv1kL)
- [x] Point yfitai.com domain to Vercel
- [x] Stripe sandbox skipped — using live account directly (acct_1S6GGcD2YT6Pvz5W)

## Next Session — Return To-Do List

### Stripe (needs support@yfitai.com access restored first)
- [x] Log into Stripe dashboard with support@yfitai.com
- [x] Webhook created: https://yfitai.com/api/stripe/webhook (3 events)
- [x] STRIPE_WEBHOOK_SECRET added to Vercel
- [ ] Add live price IDs to Vercel: STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY, STRIPE_PRICE_PRO_LIFETIME
- [ ] Test checkout flow end-to-end with live Stripe keys

### yfitai.com Domain (can do independently of Stripe)
- [x] yfitai.com and www.yfitai.com both verified and live on Vercel

### Manus Checkpoint / Publish Fix
- [ ] Send Manus support ticket with this exact message:
  "The webdev project yfit-marketing returns 'project not found' on every webdev_save_checkpoint call,
   blocking the Publish button. The project was initialized with webdev_init_project but backend
   metadata is missing. Please re-sync or re-register the project metadata for project: yfit-marketing."
- [ ] Once fixed: run checkpoint save and use Publish button in Manus UI

## March 25 2026 Session — Stripe & Signup Flow Fixes
- [x] Fix Free Basic button — navigate directly to app signup (not waitlist modal)
- [x] Fix 1-Month Free button — navigate directly to app signup (not waitlist modal)
- [x] Enable Stripe automatic tax collection on checkout (automatic_tax: {enabled: true}) — already in place
- [ ] Verify checkout flow works end-to-end on live site

## March 25 2026 Evening Session — Webhook Fix & Payment Success Update
- [x] Diagnosed Stripe webhook 307 redirect error (www vs non-www domain redirect)
- [x] Created dedicated webhook handler at api/stripe/webhook.ts with raw body parsing
- [x] Updated vercel.json to route /api/stripe/webhook directly to dedicated handler
- [x] Updated Stripe webhook endpoint URL to https://www.yfitai.com/api/stripe/webhook
- [x] Verified webhook returns 200 OK with {"received": true} response
- [x] Completed live $12.99 test transaction — payment processed successfully
- [x] Refunded $13.64 CAD test transaction (Mar 25, 8:42 PM)
- [x] Replaced App Store / Google Play buttons on payment success page with "Create Your Account Now" button linking to https://app.yfitai.com/signup
- [x] Updated payment success page steps to reflect current app availability

## Next Session — Main App & Google Play
- [ ] Google Play Console — promote from internal/beta testing to production (open track)
- [ ] Social media automation setup in main YFIT app
- [ ] Add App Store / Google Play buttons back to payment success page once apps are live

## Mar 31 2026 Session — Contact Form & FAQ Link
- [x] Wired contact form to Resend — sends notification to support@yfitai.com with reply-to set to user's email
- [x] Added automated acknowledgement email to user on form submission (includes FAQ link)
- [x] Updated "View FAQ" button to link to https://app.yfitai.com/faq (opens in new tab)
- [x] Fixed git remote — origin now correctly points to yfit-marketing GitHub repo

## Mar 31 2026 — Fixes
- [ ] Fix contact form "Email service not configured" error (RESEND_API_KEY not injected into new endpoint)
- [ ] Build public FAQ page at yfitai.com/faq (no sign-in required) and link View FAQ button there

## Mar 31 2026 — AI Auto-Responder & Marketing Improvements
- [x] Upgrade contact form API to call OpenAI GPT-4o-mini and send AI-generated answer as auto-reply
- [x] Add OpenAI API key to Vercel environment variables
- [x] Add Open Graph / Twitter Card meta tags to index.html for social sharing
- [x] Add JSON-LD structured data (schema.org SoftwareApplication) for SEO
- [x] Add robots.txt and sitemap.xml
- [x] Add cookie consent banner (GDPR/CCPA compliance)
- [ ] Add social proof section (app store ratings, user count, or press mentions)
- [x] Fix FAQ link in auto-reply email to point to yfitai.com/faq (not app.yfitai.com/faq)

## Mar 31 2026 — Supabase Contact Form Logging
- [x] Create contact_submissions table in Supabase (name, email, subject, message, ai_answer, ai_answered, created_at)
- [x] Update api/index.ts to log every contact submission and AI reply to Supabase
- [x] Add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to Vercel env vars
- [x] Test end-to-end: submit form → verify record appears in Supabase

## Apr 3 2026 — Differentiator Showcase Sections
- [x] Build animated skeleton form analysis showcase component (FormAnalysisShowcase.tsx)
- [x] Build mock provider report medication showcase component (MedicationShowcase.tsx)
- [x] Integrate both showcase sections into Home.tsx between hero and feature grid
- [x] Push to GitHub

## Apr 3 2026 — Showcase Refinements
- [x] Replace "Don Campbell" / "Dr. Sarah Mitchell" with "John Smith" / "Dr. Emily Carter" in MedicationShowcase.tsx
- [x] Update FormAnalysisShowcase colours: green for limbs, red for joints (match actual app)
- [x] Compare app form analysis code vs website demo and produce upgrade recommendation
- [x] Update FormAnalysisShowcase: add feedback history panel (green/yellow/red, scrollable, newest first)
- [x] Update FormAnalysisShowcase: change copy from "14 joints tracked" to "10 exercises supported"
- [x] Update FormAnalysisShowcase: add per-rep summary messages matching real app (e.g. "Go deeper — thighs parallel")
- [x] Update FormAnalysisShowcase: add form score arc gauge (not in app yet, but aspirational feature)
- [x] Fix MedicationShowcase footer text — remove inaccurate "90 days workout history and AI-detected interactions" claim
- [x] Remove all workout references from MedicationShowcase — footer text and left sidebar feature callout

## Apr 3 2026 — Bug Fixes
- [x] Fix black canvas bug in FormAnalysisShowcase (skeleton not rendering)
- [x] Replace workout notes tab in MedicationShowcase with real drug-drug interaction data
- [x] Fix RAF closure bug in FormAnalysisShowcase — rewrite animation loop using refs (React strict mode production fix)

## Apr 3 2026 — FormAnalysisShowcase UX Improvements
- [x] Make exercise chips clickable — each chip switches to a unique animation for that exercise
- [x] Fix play/pause — resuming should continue from current position, not restart from frame 0

## Apr 3 2026 — Web Subscribe CTA (Android app redirect strategy)
- [x] Add "Subscribe on the web" banner/section to the marketing site pricing page for Android users
- [x] Confirm legally compliant wording for in-app button directing users to yfitai.com
- [x] Fix Android banner button URL — point to app.yfitai.com/signup instead of yfitai.com homepage
- [x] Change Android banner button back to yfitai.com/#pricing and ensure anchor scroll works
- [x] Fix Android banner button — replace external href with onClick smooth scroll to #pricing section
- [ ] Update hero green badge text to "The only all in one health and fitness app that tracks everything"
- [ ] Update hero headline to "Finally, a health and fitness app that tracks your medications and analyses your exercises."
- [ ] Update hero subtext to new YFIT AI hybrid description

---

## ⚠️ CRITICAL DEPLOYMENT RULE — READ EVERY SESSION

**ALL marketing website changes go to THIS repo (`yfit-marketing-official` → yfitai.com via Vercel)**

- yfitai.com = THE LIVE REAL WEBSITE (this repo, Vercel-deployed)
- The Manus project (`/home/ubuntu/yfit-marketing/`) = DORMANT redesign, cannot be published, DO NOT push marketing changes there
- See `/home/ubuntu/YFIT_WEBSITE_ARCHITECTURE.md` for full architecture reference

---

## Apr 10 2026 — Social Media & Pinterest
- [ ] Pinterest domain verification: push meta tag to GitHub, then click Continue on Pinterest to claim yfitai.com
- [ ] Pinterest: run test post to verify videos posting to @yfitai
- [ ] TikTok: reconnect Upload-Post to YFIT AI account (on hold until April 15)
- [ ] Facebook: connect YFIT AI business page to Upload-Post
