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
        q: "What is YFIT AI?",
        a: "YFIT AI is your personal AI-powered fitness and wellness coach. It combines smart workout planning, nutrition tracking, medication management, and daily health coaching all in one app — personalized specifically to you.",
      },
      {
        q: "How do I get started?",
        a: "Simply create a free account at app.yfitai.com. You can start using the core features right away. Upgrade to Pro at any time to unlock advanced AI coaching, unlimited tracking, and priority support.",
      },
      {
        q: "Is YFIT AI free to use?",
        a: "Yes! YFIT AI has a free plan that gives you access to core features. Our Pro plan ($12.99/month, $99.99/year, or $249.99 lifetime) unlocks advanced AI coaching, unlimited history, and all premium features.",
      },
      {
        q: "What devices does YFIT AI work on?",
        a: "YFIT AI works on any device with a web browser — desktop, tablet, or phone. Native iOS and Android apps are coming soon.",
      },
      {
        q: "Do I need any fitness equipment?",
        a: "No equipment is required. YFIT AI creates workouts for any situation — home, gym, or outdoors — based on what you have available.",
      },
    ],
  },
  {
    id: "ai-coach",
    label: "AI Coach",
    icon: "🤖",
    questions: [
      {
        q: "How does the AI coach work?",
        a: "The AI coach learns your goals, fitness level, health conditions, and preferences. It then creates personalized workout and nutrition plans, adjusts them as you progress, and answers your health questions in plain, easy-to-understand language.",
      },
      {
        q: "Can the AI coach answer my health questions?",
        a: "Yes — the AI coach can answer general fitness, nutrition, and wellness questions. It is designed to be helpful and easy to understand. For medical advice, always consult your doctor.",
      },
      {
        q: "How accurate is the AI coaching?",
        a: "The AI is trained on evidence-based fitness and nutrition science. It improves as it learns more about you. That said, it is a coaching tool — not a medical device. Always check with a healthcare provider for medical concerns.",
      },
      {
        q: "Can I ask the AI coach anything?",
        a: "You can ask about workouts, nutrition, supplements, recovery, sleep, stress, and general wellness. The AI responds in simple, friendly language suitable for all fitness levels.",
      },
    ],
  },
  {
    id: "workouts",
    label: "Workouts",
    icon: "💪",
    questions: [
      {
        q: "How are my workouts personalized?",
        a: "During setup, you tell YFIT AI your fitness goals, current fitness level, available equipment, and any physical limitations. The AI builds a plan specifically for you and adjusts it over time based on your progress.",
      },
      {
        q: "Can I create my own custom workouts?",
        a: "Yes. You can build custom workouts from scratch or modify the AI-generated ones to fit your preferences.",
      },
      {
        q: "What types of workouts does YFIT AI support?",
        a: "YFIT AI supports strength training, cardio, HIIT, yoga, stretching, walking programs, and more. It covers beginner to advanced levels.",
      },
      {
        q: "Can YFIT AI help me if I have an injury or limitation?",
        a: "Yes. You can enter your physical limitations during setup and the AI will avoid exercises that could aggravate them. Always consult your doctor before starting a new exercise program if you have a medical condition.",
      },
    ],
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: "🥗",
    questions: [
      {
        q: "Does YFIT AI track calories and macros?",
        a: "Yes. You can log meals, track calories, protein, carbs, and fats, and get AI-powered suggestions to hit your nutrition goals.",
      },
      {
        q: "Can YFIT AI create meal plans?",
        a: "Yes. The AI creates personalized meal plans based on your goals, dietary preferences, and any food restrictions you have.",
      },
      {
        q: "Does YFIT AI support special diets?",
        a: "Yes — YFIT AI supports a wide range of dietary preferences including vegetarian, vegan, keto, paleo, gluten-free, and more.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & Plans",
    icon: "💳",
    questions: [
      {
        q: "What plans are available?",
        a: "YFIT AI offers four plans: Free (core features), Pro Monthly ($12.99/month), Pro Yearly ($99.99/year — save 36%), and Pro Lifetime ($249.99 one-time payment — best value).",
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Yes. You can cancel your Pro Monthly or Pro Yearly subscription at any time. You will keep access until the end of your current billing period.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed by Stripe, a PCI-compliant payment processor. YFIT AI never stores your credit card details.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 7-day money-back guarantee on all paid plans. Contact support@yfitai.com within 7 days of purchase if you are not satisfied.",
      },
      {
        q: "What happens to my data if I cancel?",
        a: "Your data is retained for 30 days after cancellation. You can export your data at any time from your account settings.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & Privacy",
    icon: "🔒",
    questions: [
      {
        q: "How do I reset my password?",
        a: 'Go to app.yfitai.com and click "Forgot Password" on the sign-in page. Enter your email and we will send you a reset link.',
      },
      {
        q: "How do I delete my account?",
        a: "You can delete your account from Settings → Account → Delete Account. This permanently removes all your data. Contact support@yfitai.com if you need help.",
      },
      {
        q: "Is my health data private?",
        a: "Yes. Your health data is encrypted and never sold to third parties. We comply with applicable privacy laws. Read our full Privacy Policy at yfitai.com/privacy.",
      },
      {
        q: "Can I export my data?",
        a: "Yes. You can export all your workout history, nutrition logs, and progress data from your account settings at any time.",
      },
    ],
  },
  {
    id: "technical",
    label: "Technical Support",
    icon: "🛠️",
    questions: [
      {
        q: "The app is not loading. What should I do?",
        a: "Try refreshing the page, clearing your browser cache, or using a different browser. If the problem continues, contact support@yfitai.com.",
      },
      {
        q: "I paid but my Pro features are not showing. What do I do?",
        a: "Sign out and sign back in using the same email you used at checkout. Your Pro features should activate automatically. If not, contact support@yfitai.com with your confirmation ID.",
      },
      {
        q: "Which browsers are supported?",
        a: "YFIT AI works best on Chrome, Safari, Firefox, and Edge (latest versions). We recommend keeping your browser up to date.",
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
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <span className="font-bold text-xl">YFIT AI</span>
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
          <Link
            href="/contact"
            className="inline-block bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Contact Support →
          </Link>
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
