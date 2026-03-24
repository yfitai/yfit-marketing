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
- [ ] Set up Stripe webhook endpoint for yfitai.com
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel environment variables
- [ ] Point yfitai.com domain to Vercel
- [ ] Claim Stripe sandbox (expires May 10 2026)

## Next Session — Return To-Do List

### Stripe (needs support@yfitai.com access restored first)
- [ ] Log into Stripe dashboard at dashboard.stripe.com with support@yfitai.com
- [ ] Claim Stripe sandbox (new link will be in email after access is restored — expires May 10 2026)
- [ ] Verify price IDs exist in Stripe: Pro Monthly, Pro Yearly, Pro Lifetime
- [ ] Add price IDs to Vercel env: STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY, STRIPE_PRICE_PRO_LIFETIME
- [ ] Create webhook endpoint: Stripe Dashboard → Developers → Webhooks → Add endpoint
  - Endpoint URL: https://yfitai.com/api/stripe/webhook
  - Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- [ ] Copy Webhook Signing Secret → add to Vercel as STRIPE_WEBHOOK_SECRET
- [ ] Test checkout flow end-to-end in Stripe test mode

### yfitai.com Domain (can do independently of Stripe)
- [ ] Go to Vercel → yfit-marketing project → Settings → Domains
- [ ] Add yfitai.com and www.yfitai.com as custom domains
- [ ] Copy DNS records Vercel provides (A record + CNAME)
- [ ] Add DNS records in domain registrar (GoDaddy or wherever yfitai.com is registered)
- [ ] Wait 10-30 min for DNS propagation, then verify yfitai.com loads the marketing site
- [ ] Update Stripe webhook URL to yfitai.com once domain is confirmed live

### Manus Checkpoint / Publish Fix
- [ ] Send Manus support ticket with this exact message:
  "The webdev project yfit-marketing returns 'project not found' on every webdev_save_checkpoint call,
   blocking the Publish button. The project was initialized with webdev_init_project but backend
   metadata is missing. Please re-sync or re-register the project metadata for project: yfit-marketing."
- [ ] Once fixed: run checkpoint save and use Publish button in Manus UI
