import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Search, MessageCircle } from "lucide-react";

const faqCategories = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "🚀",
    questions: [
      {
        q: "What is YFIT AI and how does it work?",
        a: "YFIT AI is your personal AI-powered fitness coach that combines workout tracking, nutrition logging, medication management, and daily coaching in one app. You tell YFIT your goals, fitness level, and health details — and the AI builds a personalized plan, analyzes your exercise form via your camera, tracks your meals with a barcode scanner, and sends you daily coaching tips. It learns and adapts as you progress.",
      },
      {
        q: "Do I need any equipment or a gym membership?",
        a: "No equipment or gym membership is required. YFIT works for home workouts, gym sessions, outdoor training, and everything in between. The app includes bodyweight workout plans, dumbbell routines, full gym programs, and cardio tracking — so it adapts to whatever you have available.",
      },
      {
        q: "How is YFIT different from other fitness apps?",
        a: "Three things set YFIT apart. First, real-time AI form analysis uses your phone's camera to watch your exercise technique and give instant feedback — like having a personal trainer watching every rep. Second, YFIT is the only fitness app that also tracks medications and checks for interactions with your supplements and nutrition. Third, everything is connected: your workouts, food, medications, and progress all feed into one AI that gives you a complete picture of your health.",
      },
      {
        q: "Is there a free plan? What does it include?",
        a: "Yes — YFIT has a free Basic plan with no credit card required. It includes workout logging, basic nutrition tracking, and access to the exercise library. For full AI coaching, form analysis, medication tracking, barcode scanning, and advanced analytics, you'll need a Pro plan. We also offer a limited-time free month of Pro so you can experience everything before committing.",
      },
    ],
  },
  {
    id: "ai-features",
    label: "AI Features",
    icon: "🤖",
    questions: [
      {
        q: "How does the AI form analysis work?",
        a: "When you start an exercise, you position your phone so the camera can see you. YFIT's AI tracks your body position in real time and compares it to correct form benchmarks. It gives you instant audio and visual cues — for example, telling you to keep your back straight during a deadlift or to lower your squat depth. No special equipment is needed, just your phone camera.",
      },
      {
        q: "Can YFIT track my medications and supplements?",
        a: "Yes — this is one of YFIT's unique features. You can log all your medications, vitamins, and supplements. The app tracks your dosage schedule, sends reminders, and checks for potential interactions between your medications and the nutrients in your diet. This is especially useful for athletes taking pre-workout supplements or anyone managing a health condition alongside their fitness goals.",
      },
      {
        q: "How does nutrition tracking work? Do I have to weigh everything?",
        a: "YFIT makes nutrition tracking as easy as possible. You can scan barcodes on packaged food for instant logging, search a database of millions of foods, or describe a meal in plain language and let the AI estimate the macros. You don't have to weigh everything — the app supports portion estimates and learns your common meals over time to make logging faster.",
      },
      {
        q: "Does YFIT give me a personalized workout plan?",
        a: "Yes. When you set up your profile, you enter your goals (weight loss, muscle gain, endurance, etc.), current fitness level, available equipment, and how many days per week you want to train. The AI generates a structured program tailored to you. As you complete workouts and log progress, the plan automatically adjusts — increasing difficulty when you're ready and modifying exercises if you report discomfort or injury.",
      },
    ],
  },
  {
    id: "billing",
    label: "Pricing & Billing",
    icon: "💳",
    questions: [
      {
        q: "What are the Pro plan options and prices?",
        a: "YFIT Pro is available in three options: Monthly at $12.99/month, Yearly at $99.99/year (saving 35% vs monthly — our Best Value), and Lifetime at $249.99 as a one-time payment (our Most Popular option). All Pro plans include the full feature set: AI form analysis, medication tracking, barcode nutrition scanning, advanced analytics, and unlimited AI coaching. Prices are in USD.",
      },
      {
        q: "Can I cancel my subscription at any time?",
        a: "Yes, absolutely. You can cancel your Pro subscription at any time through your account settings with no cancellation fees and no questions asked. When you cancel, you keep Pro access until the end of your current billing period. After that, your account moves to the free Basic plan and your data is preserved.",
      },
      {
        q: "Do you offer refunds?",
        a: "Yes — we offer a 30-day money-back guarantee on all Pro plans. If you're not satisfied within the first 30 days, contact us at support@yfitai.com and we'll process a full refund. The 30-day guarantee applies to Lifetime plans as well.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed by Stripe, a PCI-DSS Level 1 certified payment processor — the same standard used by Amazon and Google. YFIT never stores your credit card details on our servers.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    icon: "🔒",
    questions: [
      {
        q: "Is my health and fitness data secure?",
        a: "Yes. All your data is encrypted in transit and at rest using industry-standard AES-256 encryption. We never sell your personal or health data to third parties. Your health information — including medications, workouts, and nutrition — is stored securely and only accessible to you. You can request a full export or deletion of your data at any time by emailing support@yfitai.com.",
      },
      {
        q: "Does YFIT share my data with advertisers or third parties?",
        a: "No. YFIT does not sell or share your personal health data with advertisers or data brokers. We use your data solely to power your personalized coaching experience within the app. We may use anonymized, aggregated data to improve the AI — but this is never linked back to you individually.",
      },
      {
        q: "How do I delete my account and data?",
        a: "You can request full account and data deletion by emailing support@yfitai.com. We will permanently delete your account, workout history, nutrition logs, health data, and all associated information within 30 days of your request. This action is irreversible, so please export any data you want to keep before requesting deletion.",
      },
    ],
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          (activeCategory === "all" || activeCategory === cat.id) &&
          (searchQuery === "" ||
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  const totalResults = filteredCategories.reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663099417101/YPVUcoNPoLMtiepj.png"
              alt="YFIT AI"
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact Support
            </Link>
            <a
              href="https://app.yfitai.com/signup"
              className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-accent py-16 px-4 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Quick answers to common questions about YFIT AI.
        </p>
        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
            }`}
          >
            All Topics
          </button>
          {faqCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Results count when searching */}
        {searchQuery && (
          <p className="text-center text-muted-foreground mb-6 text-sm">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {/* FAQ Sections */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-lg font-medium text-gray-700 mb-2">No results found</p>
            <p className="text-muted-foreground mb-6">
              Try a different search term or browse all categories.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              className="text-primary font-medium hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((cat) => (
              <div key={cat.id}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.label}
                </h2>
                <div className="space-y-3">
                  {cat.questions.map((item, idx) => {
                    const key = `${cat.id}-${idx}`;
                    const isOpen = openItems[key];
                    return (
                      <div
                        key={key}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-800">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still need help CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 text-center border border-primary/20">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">
            Our support team typically responds within 4–6 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Contact Support →
            </Link>
            <a
              href="https://app.yfitai.com/signup"
              className="inline-block bg-white border border-primary/30 text-primary px-8 py-3 rounded-xl font-semibold hover:bg-primary/5 transition-colors"
            >
              Start Free — No Card Required
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 YFIT AI. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
