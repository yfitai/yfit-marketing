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
- [ ] Connect waitlist form to Supabase + Resend email system (send welcome email on signup)
- [ ] Add waitlist entries to Supabase database table
- [ ] Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel environment variables
- [ ] Add RESEND_API_KEY to Vercel environment variables
- [ ] Set up Stripe webhook endpoint for yfitai.com
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel environment variables
- [ ] Point yfitai.com domain to Vercel
- [ ] Claim Stripe sandbox (expires May 10 2026)
