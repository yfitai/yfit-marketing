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
- [ ] Contact form email sending
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
