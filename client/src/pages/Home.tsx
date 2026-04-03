import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FormAnalysisShowcase from "@/components/FormAnalysisShowcase";
import MedicationShowcase from "@/components/MedicationShowcase";
import { Check, ArrowRight, Activity, Zap, Smartphone, BarChart3, Pill, Eye, Target, Dumbbell, TrendingUp, Apple, Calendar, Brain, Loader2, X, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

export default function Home() {
  const [, navigate] = useLocation();

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goToSignIn = () => navigate('/signin');
  const goToSignUp = () => navigate('/signup');
  const { startCheckout, isLoading: checkoutLoading } = useStripeCheckout();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    try {
      const nameParts = waitlistName.trim().split(' ');
      const firstName = nameParts[0] || waitlistName.trim();
      const lastName = nameParts.slice(1).join(' ');
      await fetch('/api/index?path=/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, firstName, lastName }),
      });
    } catch (err) {
      // Graceful degradation — show success even if API fails
      console.warn('[Waitlist] Signup error:', err);
    }
    setWaitlistLoading(false);
    setWaitlistSubmitted(true);
  };

  const goToContact = () => navigate('/contact');
  const goToPrivacy = () => navigate('/privacy');
  const goToTerms = () => navigate('/terms');

  // 8 Feature Cards - exact colors from the YFIT app
  const features = [
    {
      icon: Target,
      title: "Goals",
      description: "Set and track personalized fitness goals tailored to your unique journey",
      cardBg: "bg-blue-600",
      features: ["Set personalized fitness targets", "Track body measurements", "Calculate BMI and body fat", "Adjust goals based on progress"]
    },
    {
      icon: Apple,
      title: "Nutrition",
      description: "Scan barcodes, log meals, and track macros with AI-powered nutrition insights",
      cardBg: "bg-green-600",
      features: ["Barcode scanning for quick logging", "Track macros and calories", "AI-powered meal suggestions", "Nutritional insights and reports"]
    },
    {
      icon: Dumbbell,
      title: "Fitness",
      description: "Access personalized workout plans with real-time form analysis and coaching",
      cardBg: "bg-purple-600",
      features: ["Personalized workout plans", "Real-time form analysis", "Exercise demonstrations", "Progressive overload tracking"]
    },
    {
      icon: Calendar,
      title: "Daily Tracker",
      description: "Log your daily activities, meals, workouts, and medications in one place",
      cardBg: "bg-orange-600",
      features: ["Log daily activities", "Track meals and workouts", "Monitor medications", "Daily progress overview"]
    },
    {
      icon: Pill,
      title: "Medications",
      description: "Track prescriptions, supplements, and generate provider reports for doctor visits",
      cardBg: "bg-pink-600",
      features: ["Track prescriptions and supplements", "Generate provider reports", "Monitor medication schedules", "Health integration"]
    },
    {
      icon: BarChart3,
      title: "Progress",
      description: "Visualize your transformation with detailed analytics and progress photos",
      cardBg: "bg-teal-600",
      features: ["Visual progress charts", "Body measurement tracking", "Progress photo comparisons", "Milestone celebrations"]
    },
    {
      icon: TrendingUp,
      title: "Predictions",
      description: "AI-powered forecasts for your weight, strength, and fitness milestones",
      cardBg: "bg-indigo-600",
      features: ["AI weight forecasting", "Strength progression predictions", "Goal timeline estimates", "Personalized insights"]
    },
    {
      icon: Brain,
      title: "AI Coach",
      description: "Your 24/7 intelligent fitness companion providing personalized guidance",
      cardBg: "bg-violet-600",
      features: ["24/7 AI coaching", "Personalized workout advice", "Nutrition recommendations", "Motivation and support"]
    },
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: "Free Basic",
      price: "$0",
      period: "",
      description: "Perfect for getting started",
      badge: null,
      badgeColor: null,
      features: [
        "Basic workout tracking",
        "Manual meal logging",
        "2 saved workout routines",
        "Basic progress tracking",
        "Weight & body metrics",
        "3 AI form analyses/month",
        "Limited AI Coach queries"
      ],
      buttonText: "Start Free — No Credit Card",
      buttonStyle: "outline" as const,
      highlighted: false,
      stripeKey: "signup" as any,
    },
    {
      name: "Pro Monthly",
      price: "$12.99",
      period: "/month",
      description: "Most flexible option",
      badge: null,
      badgeColor: null,
      features: [
        "Everything in Free",
        "Barcode nutrition scanning",
        "AI form analysis",
        "Medication tracking",
        "Provider reports",
        "Advanced analytics",
        "Priority support"
      ],
      buttonText: "Start Pro Monthly",
      buttonStyle: "default" as const,
      highlighted: false,
      stripeKey: "proMonthly" as const,
    },
    {
      name: "Pro Yearly",
      price: "$99.99",
      period: "/year",
      description: "Save 35% vs monthly",
      badge: "BEST VALUE",
      badgeColor: "bg-green-600",
      features: [
        "Everything in Pro Monthly",
        "Exclusive workshops",
        "Early access to new features",
        "Advanced health insights",
        "Priority support"
      ],
      buttonText: "Start Pro Yearly",
      buttonStyle: "default" as const,
      highlighted: true,
      stripeKey: "proYearly" as const,
    },
    {
      name: "Pro Lifetime",
      price: "$249.99",
      period: " one-time",
      description: "Pay once, own forever",
      badge: "MOST POPULAR",
      badgeColor: "bg-violet-600",
      features: [
        "Everything in Pro Yearly",
        "Lifetime access — pay once",
        "All future features included",
        "Founder's Badge",
        "Direct developer access",
        "No recurring charges ever"
      ],
      buttonText: "Get Lifetime Access",
      buttonStyle: "default" as const,
      highlighted: false,
      stripeKey: "proLifetime" as const,
    },
    {
      name: "Limited Time Offer",
      price: "1 Month FREE",
      period: "",
      description: "Full featured Pro plan",
      badge: "LIMITED TIME",
      badgeColor: "bg-orange-500",
      features: [
        "Full Pro features included",
        "No credit card required",
        "Cancel anytime",
        "Instant access",
        "All 8 app features",
      ],
      buttonText: "Claim Free Month",
      buttonStyle: "default" as const,
      highlighted: false,
      isOffer: true,
      stripeKey: "signup" as any,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Limited Time Offer Banner */}
      <div className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 text-center font-semibold text-sm md:text-base">
        🎉 LIMITED TIME OFFER: Get 1 Month FREE on All Pro Plans! 🎉
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 border-b border-primary/20 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={scrollToFeatures} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</button>
            <button onClick={scrollToPricing} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</button>
            <button onClick={goToContact} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</button>
            <Button onClick={goToSignIn} variant="outline" size="sm">Sign In</Button>
            <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white">
              Get Started
            </Button>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden flex gap-2">
            <Button onClick={goToSignIn} variant="outline" size="sm">Sign In</Button>
            <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white">Start</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600/10 border border-green-600/20 text-green-700 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>The only all in one health and fitness app that tracks everything</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                Finally, a health and fitness app that tracks your medications and{" "}
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">analyses your exercises.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                YFIT AI is a hybrid, human and AI app that combines AI coaching, nutrition tracking, and medication-aware workout plans — all in one app. Built to help busy people who want an all in one plan for improved health.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={goToSignUp} size="lg" className="text-lg px-8 bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90 text-white shadow-lg">
                  Start Free — No Credit Card Required
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={scrollToPricing} size="lg" variant="outline" className="text-lg px-8 border-green-600/30 hover:bg-green-50">
                  View Pricing
                </Button>
              </div>
              {/* Social proof strip */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {["bg-green-500","bg-blue-500","bg-violet-500","bg-orange-500"].map((c,i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>{["J","S","M","A"][i]}</div>
                    ))}
                  </div>
                  <span><strong className="text-foreground">Join our growing community</strong> of early adopters</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400">★</span>)}
                  <span className="text-muted-foreground ml-1">Early access members</span>
                </div>
              </div>
            </div>

            {/* Hero Feature Preview */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-600/10 to-violet-600/10 opacity-50 blur-3xl rounded-full" />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">App Features Preview</p>
                {[
                  { label: "Set Goals", sub: "Personalized targets", color: "bg-blue-600", textColor: "text-blue-700", bgLight: "bg-blue-50" },
                  { label: "Track Nutrition", sub: "Scan barcodes", color: "bg-green-600", textColor: "text-green-700", bgLight: "bg-green-50" },
                  { label: "AI Form Analysis", sub: "Real-time coaching", color: "bg-purple-600", textColor: "text-purple-700", bgLight: "bg-purple-50" },
                  { label: "Track Medications", sub: "Provider reports", color: "bg-pink-600", textColor: "text-pink-700", bgLight: "bg-pink-50" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${item.bgLight} border border-gray-100`}>
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${item.textColor}`}>{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">What early users are saying</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "Finally an app that lets me track my blood pressure meds alongside my workouts. My doctor loves the reports it generates.",
                name: "Sarah M.",
                role: "Beta Tester · Vancouver, BC",
                avatar: "S",
                color: "bg-green-500"
              },
              {
                quote: "The AI form analysis caught my squat form issue that was causing knee pain. Three weeks in and the pain is gone.",
                name: "James R.",
                role: "Beta Tester · Toronto, ON",
                avatar: "J",
                color: "bg-blue-500"
              },
              {
                quote: "I've tried MyFitnessPal, Noom, and five others. YFIT is the first one that actually connects everything — nutrition, meds, and workouts in one place.",
                name: "Maria T.",
                role: "Beta Tester · Calgary, AB",
                avatar: "M",
                color: "bg-violet-500"
              }
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col gap-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator Showcase: Form Analysis */}
      <FormAnalysisShowcase />

      {/* Differentiator Showcase: Medication Tracking */}
      <MedicationShowcase />

      {/* 8 Feature Cards */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              YFIT AI provides 8 powerful tools to help you achieve your fitness goals with personalized AI guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={`${feature.cardBg} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/80 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-1.5">
                    {feature.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/90">
                        <Check className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Makes YFIT Different */}
      <section id="unique" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-sm font-bold">
              EXCLUSIVE FEATURES
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">What Makes YFIT Different</h2>
            <p className="text-lg text-muted-foreground">
              While other apps focus on basic tracking, YFIT offers features you won't find anywhere else.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Medication Tracking */}
            <div className="bg-blue-700 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <Pill className="w-8 h-8 text-white" />
                </div>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">EXCLUSIVE FEATURE</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Medication-Aware Fitness</h3>
              <p className="text-white/80 text-sm mb-4">The only fitness app that integrates your prescriptions</p>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-white/90 text-sm leading-relaxed">
                  <strong>66% of adults</strong> take at least one prescription medication. Yet every other fitness app ignores this entirely. YFIT tracks your medications alongside your workouts and nutrition — and generates professional reports your doctor can actually use.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "Smart reminders synced to your workout schedule",
                  "Track supplements, vitamins & prescriptions",
                  "Generate provider reports for doctor visits",
                  "AI Coach considers your medications in advice",
                  "Monitor how medications affect your performance"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={goToSignUp} className="mt-6 w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                Try It Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            {/* Form Analysis */}
            <div className="bg-teal-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">AI-POWERED</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Real-Time Form Analysis</h3>
              <p className="text-white/80 text-sm mb-4">Your personal AI trainer watching every rep</p>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-white/90 text-sm leading-relaxed">
                  <strong>67% of gym injuries</strong> are caused by poor form. YFIT's AI analyzes your movement in real-time using your device camera, giving instant audio and visual corrections before injury happens.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "Live posture correction during every exercise",
                  "Instant audio cues for immediate adjustments",
                  "Form score tracked over time",
                  "Detailed form report after each workout",
                  "Injury prevention recommendations"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={goToSignUp} className="mt-6 w-full bg-white text-teal-700 hover:bg-teal-50 font-semibold">
                Try It Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-300 text-orange-700 text-sm font-bold mb-4">
              <Zap className="w-4 h-4" />
              Limited Time: Get 1 Month FREE on any Pro plan
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Start Free. Upgrade When Ready.</h2>
            <p className="text-lg text-muted-foreground">
              No credit card required to start. Cancel anytime. Your first Pro month is on us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="relative flex flex-col">
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                    <span className={`${plan.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <Card className={`flex flex-col h-full ${plan.highlighted ? 'border-green-500 shadow-xl ring-2 ring-green-500/30' : plan.isOffer ? 'border-orange-400 bg-orange-50' : 'border-gray-200'} ${plan.badge ? 'pt-2' : ''}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className={`text-lg ${plan.isOffer ? 'text-orange-600' : plan.highlighted ? 'text-green-700' : ''}`}>{plan.name}</CardTitle>
                    <div className={`text-2xl font-bold mt-1 ${plan.isOffer ? 'text-orange-600' : ''}`}>
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.isOffer ? 'text-orange-500' : plan.highlighted ? 'text-green-600' : 'text-primary'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => {
                        if (plan.stripeKey === "signup") {
                          window.open('https://app.yfitai.com/signup', '_blank');
                        } else if (plan.stripeKey === "waitlist") {
                          setShowWaitlist(true);
                          setWaitlistSubmitted(false);
                          setWaitlistEmail("");
                          setWaitlistName("");
                        } else if (!plan.stripeKey) {
                          goToSignUp();
                        } else {
                          startCheckout({ plan: plan.stripeKey });
                        }
                      }}
                      disabled={checkoutLoading === plan.stripeKey}
                      className={`w-full text-sm ${plan.isOffer ? 'bg-orange-500 hover:bg-orange-600 text-white' : plan.highlighted ? 'bg-green-600 hover:bg-green-700 text-white' : plan.buttonStyle === 'outline' ? '' : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white'}`}
                      variant={plan.buttonStyle === 'outline' ? 'outline' : 'default'}
                    >
                      {checkoutLoading === plan.stripeKey ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Android Web Subscribe Banner */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-green-900/90 to-teal-900/90 border border-green-500/30 rounded-2xl px-6 py-5 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341 14.63 12l2.893-3.341A1 1 0 0 0 16.77 7H7.23a1 1 0 0 0-.753 1.659L9.37 12l-2.893 3.341A1 1 0 0 0 7.23 17h9.54a1 1 0 0 0 .753-1.659z"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Using YFIT on Android?</p>
                <p className="text-green-300 text-xs mt-0.5">Subscribe on our website and pay less — no app store fees added to your plan price.</p>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-green-500/25 whitespace-nowrap"
            >
              View Plans
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">Compare Plans</h2>
            <p className="text-muted-foreground text-lg">Everything you need to choose the right plan for your fitness journey.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-5 py-4 font-semibold w-52">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold">Free</th>
                  <th className="text-center px-4 py-4 font-semibold">Pro Monthly</th>
                  <th className="text-center px-4 py-4 font-semibold bg-green-700">Pro Yearly</th>
                  <th className="text-center px-4 py-4 font-semibold bg-violet-700">Pro Lifetime</th>
                </tr>
                <tr className="bg-gray-800 text-gray-300 text-xs">
                  <td className="px-5 py-2 text-gray-400">Price</td>
                  <td className="text-center px-4 py-2 font-medium text-white">$0</td>
                  <td className="text-center px-4 py-2 font-medium text-white">$12.99/mo</td>
                  <td className="text-center px-4 py-2 font-medium text-white bg-green-900">$99.99/yr</td>
                  <td className="text-center px-4 py-2 font-medium text-white bg-violet-900">$249.99 once</td>
                </tr>
                <tr className="bg-orange-50 text-xs border-b border-orange-100">
                  <td className="px-5 py-2 text-gray-500 italic">Promotional Offer</td>
                  <td className="text-center px-4 py-2 text-gray-400">—</td>
                  <td className="text-center px-4 py-2 text-orange-600 font-semibold">+1 Month FREE</td>
                  <td className="text-center px-4 py-2 text-orange-600 font-semibold">+1 Month FREE</td>
                  <td className="text-center px-4 py-2 text-gray-400">—</td>
                </tr>
              </thead>
              <tbody>
                {/* Section header helper */}
                {([
                  {
                    section: "TRACKING",
                    rows: [
                      { label: "Basic Workout Tracking",   free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Manual Meal Logging",       free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Weight & Body Metrics",     free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Step Count & Daily Activity",free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Barcode Scanner",           free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Micronutrient Tracking",    free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Water Intake Logging",      free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Medication Tracking",       free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: "AI FEATURES",
                    rows: [
                      { label: "AI Form Analysis",          free: "3/month", monthly: "Unlimited", yearly: "Unlimited", lifetime: "Unlimited" },
                      { label: "AI Coach",                  free: "Limited", monthly: "Unlimited", yearly: "Unlimited", lifetime: "Unlimited" },
                      { label: "AI Predictions & Forecasts",free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Personalised Meal Plans",   free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Workout Recommendations",   free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: "PLANNING",
                    rows: [
                      { label: "Saved Workout Routines",    free: "2", monthly: "Unlimited", yearly: "Unlimited", lifetime: "Unlimited" },
                      { label: "Grocery Lists",             free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Provider Reports",          free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Medication Reminders",      free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: "ANALYTICS",
                    rows: [
                      { label: "Basic Progress Charts",     free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Advanced Analytics",        free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Trend Analysis Over Time",  free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                    ]
                  },
                  {
                    section: "SUPPORT & PERKS",
                    rows: [
                      { label: "Community Support",         free: "✅", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Priority Support",          free: "❌", monthly: "✅", yearly: "✅", lifetime: "✅" },
                      { label: "Exclusive Workshops",       free: "❌", monthly: "❌", yearly: "✅", lifetime: "✅" },
                      { label: "Early Access Features",     free: "❌", monthly: "❌", yearly: "✅", lifetime: "✅" },
                      { label: "Founder's Badge",           free: "❌", monthly: "❌", yearly: "❌", lifetime: "✅" },
                      { label: "Direct Dev Access",         free: "❌", monthly: "❌", yearly: "❌", lifetime: "✅" },
                      { label: "All Future Features",       free: "❌", monthly: "❌", yearly: "❌", lifetime: "✅" },
                      { label: "No Recurring Charges",      free: "✅", monthly: "❌", yearly: "❌", lifetime: "✅" },
                    ]
                  },
                ] as { section: string; rows: { label: string; free: string; monthly: string; yearly: string; lifetime: string }[] }[]).map((group, gi) => (
                  <>
                    <tr key={`section-${gi}`} className="bg-gray-100">
                      <td colSpan={5} className="px-5 py-2 text-xs font-bold tracking-widest text-gray-500 uppercase">{group.section}</td>
                    </tr>
                    {group.rows.map((row, ri) => (
                      <tr key={`row-${gi}-${ri}`} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-5 py-3 text-gray-700 font-medium">{row.label}</td>
                        <td className="text-center px-4 py-3 text-gray-600">{row.free}</td>
                        <td className="text-center px-4 py-3 text-gray-700">{row.monthly}</td>
                        <td className="text-center px-4 py-3 text-gray-700 bg-green-50">{row.yearly}</td>
                        <td className="text-center px-4 py-3 text-gray-700 bg-violet-50">{row.lifetime}</td>
                      </tr>
                    ))}
                  </>
                ))}
                {/* CTA row */}
                <tr className="bg-gray-900">
                  <td className="px-5 py-4 text-white font-semibold text-sm">Ready to start?</td>
                  <td className="text-center px-4 py-4">
                    <button onClick={() => window.location.href='/signup'} className="text-xs bg-white text-gray-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Get Free</button>
                  </td>
                  <td className="text-center px-4 py-4">
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Choose Monthly</button>
                  </td>
                  <td className="text-center px-4 py-4 bg-green-900">
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-xs bg-green-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-green-400 transition-colors">Best Value</button>
                  </td>
                  <td className="text-center px-4 py-4 bg-violet-900">
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="text-xs bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-400 transition-colors">Own Forever</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">All prices in USD. Taxes calculated at checkout. Cancel anytime for monthly and yearly plans.</p>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Complete Fitness Ecosystem</h2>
            <p className="text-lg text-muted-foreground">
              Powered by cutting-edge AI to deliver the most personalized fitness experience ever created.
            </p>
          </div>

          {/* YFIT Overview Card */}
          <div className="mb-10">
            <div className="bg-gray-900 rounded-2xl p-8 md:p-10 text-white shadow-xl border border-gray-700">
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                {/* Left side: logo + decorative block */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4 md:w-48">
                  <div className="bg-white rounded-2xl p-4 w-full flex items-center justify-center shadow-md">
                    <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI" className="w-36 object-contain" />
                  </div>
                  <div className="hidden md:flex flex-col items-center gap-2 w-full">
                    <div className="w-full h-1 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 opacity-60" />
                    <div className="grid grid-cols-3 gap-1.5 w-full mt-1">
                      {["bg-green-500","bg-purple-500","bg-blue-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-indigo-500","bg-violet-500","bg-cyan-500"].map((c,i) => (
                        <div key={i} className={`h-2 rounded-full ${c} opacity-70`} />
                      ))}
                    </div>
                    <p className="text-gray-500 text-xs text-center mt-2 leading-relaxed">8 integrated<br/>tracking modules</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-base leading-relaxed mb-6">
                    YFIT is a comprehensive health and fitness app that tracks everything you need in one place:
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { color: "bg-green-500", label: "Nutrition", detail: "Daily calories, macros (protein, carbs, fat), meal logs, and water intake" },
                      { color: "bg-purple-500", label: "Fitness", detail: "Workout sessions, exercises, sets, reps, weights, and form analysis scores" },
                      { color: "bg-blue-500", label: "Body Metrics", detail: "Weight, body fat %, BMI, and 9 body measurements (waist, hips, biceps, etc.)" },
                      { color: "bg-orange-500", label: "Daily Activity", detail: "Step count, calories burned, and activity streaks" },
                      { color: "bg-pink-500", label: "Medications", detail: "Medication schedules, dosages, reminders and provider reports" },
                      { color: "bg-teal-500", label: "Progress", detail: "Charts and trends for all tracked metrics over time" },
                      { color: "bg-indigo-500", label: "AI Coaching", detail: "Personalised advice, workout recommendations, and Q&A" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0 mt-1.5`} />
                        <div>
                          <span className="font-semibold text-white text-sm">{item.label}:</span>
                          <span className="text-gray-400 text-xs ml-1 leading-relaxed">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-4">
                    <span className="text-white font-semibold">Everything is connected</span> — so your AI Coach can give you personalised advice based on your actual data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, color: "bg-blue-600", title: "Barcode Scanner", desc: "Scan any food barcode for instant nutrition tracking. Our database logs nutritional information and calculates your daily macros automatically.", bg: "bg-blue-50" },
              { icon: Activity, color: "bg-violet-600", title: "Smart AI Coaching", desc: "Your personal AI coach adapts to your progress, providing tailored workout plans, nutrition advice, and motivation when you need it most.", bg: "bg-violet-50" },
              { icon: BarChart3, color: "bg-teal-600", title: "Deep Analytics", desc: "Visualize your progress with professional-grade analytics. Track muscle recovery, strength trends, and more with detailed insights.", bg: "bg-teal-50" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`${item.bg} rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            No credit card required · Free forever plan available
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">The fitness app that actually knows you.</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Medications, workouts, nutrition, and AI coaching — all connected. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={goToSignUp} size="lg" className="text-lg px-8 bg-white text-green-700 hover:bg-gray-100 shadow-lg font-semibold">
              Start Free — No Credit Card Required
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={scrollToPricing} size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png" alt="YFIT AI" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-sm text-muted-foreground">The most personalized AI fitness app ever built.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={scrollToFeatures} className="hover:text-primary transition-colors">Features</button></li>
                <li><button onClick={scrollToPricing} className="hover:text-primary transition-colors">Pricing</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={goToPrivacy} className="hover:text-primary transition-colors">Privacy Policy</button></li>
                <li><button onClick={goToTerms} className="hover:text-primary transition-colors">Terms of Service</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={goToContact} className="hover:text-primary transition-colors">Contact Us</button></li>
                <li><button onClick={goToContact} className="hover:text-primary transition-colors">Support Center</button></li>
                <li><p className="text-xs">support@yfitai.com</p></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2026 YFIT AI. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <button onClick={goToPrivacy} className="hover:text-primary transition-colors">Privacy</button>
              <button onClick={goToTerms} className="hover:text-primary transition-colors">Terms</button>
              <button onClick={goToContact} className="hover:text-primary transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Start Free Today</p>
            <p className="text-xs text-muted-foreground">No credit card required</p>
          </div>
          <Button onClick={goToSignUp} size="sm" className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold px-5 flex-shrink-0">
            Get Started
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlist(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowWaitlist(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {!waitlistSubmitted ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Join the Waitlist</h2>
                </div>
                <p className="text-gray-500 mb-6 text-sm">
                  Be the first to know when YFIT AI launches. We'll send you early access and exclusive launch offers.
                </p>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={waitlistName}
                      onChange={e => setWaitlistName(e.target.value)}
                      placeholder="First name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={waitlistLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white font-semibold py-2.5"
                  >
                    {waitlistLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining...</>
                    ) : (
                      "Join Waitlist — It's Free"
                    )}
                  </Button>
                </form>
                <p className="text-xs text-gray-400 mt-4 text-center">No spam. Unsubscribe anytime.</p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're on the list! 🎉</h2>
                <p className="text-gray-500 text-sm mb-3">
                  Welcome, <strong>{waitlistName.trim().split(' ')[0]}</strong>! Check your inbox — we just sent you a welcome email at <strong>{waitlistEmail}</strong>.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Ready to start right now?</p>
                  <p className="text-xs text-gray-500">Create your free account and get instant access to YFIT AI — no credit card required.</p>
                </div>
                <Button
                  onClick={() => { window.open('https://app.yfitai.com/signup', '_blank'); setShowWaitlist(false); }}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white font-semibold py-3 text-base mb-3"
                >
                  Create My Free Account →
                </Button>
                <button
                  onClick={() => setShowWaitlist(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  I'll sign up later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
