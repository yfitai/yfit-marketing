import { useState } from "react";

const MEDICATIONS = [
  {
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    purpose: "Type 2 Diabetes",
    startDate: "Jan 15, 2024",
    status: "active",
    interaction: null,
  },
  {
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily (morning)",
    purpose: "Blood Pressure",
    startDate: "Mar 3, 2023",
    status: "active",
    interaction: "⚠️ Avoid intense cardio within 2hrs of dose",
  },
  {
    name: "Vitamin D3",
    dosage: "2000 IU",
    frequency: "Once daily",
    purpose: "Supplement",
    startDate: "Sep 1, 2024",
    status: "active",
    interaction: null,
  },
  {
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily (evening)",
    purpose: "Cholesterol",
    startDate: "Jun 20, 2023",
    status: "active",
    interaction: "⚠️ Muscle soreness may be amplified post-workout",
  },
];

const DRUG_INTERACTIONS = [
  {
    drugs: "Metformin + Atorvastatin",
    severity: "low",
    label: "Low Risk",
    detail: "Statins may slightly increase blood glucose. Monitor levels if starting Atorvastatin alongside Metformin.",
  },
  {
    drugs: "Lisinopril + Intense Exercise",
    severity: "moderate",
    label: "Caution",
    detail: "ACE inhibitors can cause blood pressure to drop sharply during high-intensity cardio. Avoid HIIT within 2hrs of dose.",
  },
  {
    drugs: "Atorvastatin + High-Intensity Training",
    severity: "moderate",
    label: "Caution",
    detail: "Statins can amplify exercise-induced muscle soreness (myopathy risk). Reduce intensity if unusual soreness occurs.",
  },
  {
    drugs: "Vitamin D3 + Metformin",
    severity: "none",
    label: "No Interaction",
    detail: "No known interaction. Vitamin D3 supplementation is generally safe alongside Metformin.",
  },
];

export default function MedicationShowcase() {
  const [activeTab, setActiveTab] = useState<"report" | "interactions">("report");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1800);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-600 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            Medication Tracking — Only on YFIT
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            The only fitness app your{" "}
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              doctor will thank you for.
            </span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            66% of adults take at least one prescription medication. No other fitness app accounts for how your meds affect your workouts — until now.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — feature list */}
          <div className="space-y-8 lg:pt-8">
            {[
              {
                icon: "💊",
                title: "Track Every Medication",
                desc: "Prescriptions, supplements, vitamins — all in one place. Set reminders so you never miss a dose.",
                color: "#ec4899",
              },
              {
                icon: "⚡",
                title: "Drug Interaction Alerts",
                desc: "YFIT checks your full medication list for known interactions and flags combinations that may affect your health or training.",
                color: "#a855f7",
              },
              {
                icon: "📋",
                title: "Provider Reports",
                desc: "One tap generates a clean, printable PDF showing your medications, dosages, frequencies, and interaction warnings — ready to hand to your doctor.",
                color: "#3b82f6",
              },
              {
                icon: "🔬",
                title: "Holistic Health View",
                desc: "See your fitness data alongside your medication schedule. Spot patterns — like how your energy dips on certain dosing days.",
                color: "#10b981",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: item.color + "15", border: `1px solid ${item.color}30` }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <a
                href="https://app.yfitai.com"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
              >
                Start Tracking Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs text-gray-400 mt-3">Medication tracking included in Pro plan</p>
            </div>
          </div>

          {/* Right — mock provider report */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-pink-500/10 border border-gray-100 overflow-hidden">
            {/* Report header */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">YFIT AI — Provider Report</div>
                  <div className="text-white font-bold text-lg">John Smith</div>
                  <div className="text-white/70 text-sm">Generated April 3, 2026</div>
                </div>
                <div className="text-right">
                  <div className="text-white/70 text-xs mb-1">Shared with</div>
                  <div className="text-white font-semibold text-sm">Dr. Emily Carter</div>
                  <div className="text-white/70 text-xs">Family Medicine</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("report")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "report"
                    ? "text-pink-600 border-b-2 border-pink-600 bg-pink-50/50"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                💊 Medications
              </button>
              <button
                onClick={() => setActiveTab("interactions")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "interactions"
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ⚡ Interactions
              </button>
            </div>

            {/* Tab content */}
            <div className="p-5">
              {activeTab === "report" ? (
                <div className="space-y-3">
                  {MEDICATIONS.map((med) => (
                    <div
                      key={med.name}
                      className="rounded-xl border p-4 transition-all hover:shadow-sm"
                      style={{
                        borderColor: med.interaction ? "#fde68a" : "#e5e7eb",
                        background: med.interaction ? "#fffbeb" : "white",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{med.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{med.dosage}</span>
                            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Active" />
                          </div>
                          <div className="text-xs text-gray-500">{med.frequency} · {med.purpose}</div>
                          {med.interaction && (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                              {med.interaction}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                          Since<br />{med.startDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {DRUG_INTERACTIONS.map((item) => (
                    <div
                      key={item.drugs}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: item.severity === "moderate" ? "#fde68a" : item.severity === "low" ? "#bfdbfe" : "#d1fae5",
                        background: item.severity === "moderate" ? "#fffbeb" : item.severity === "low" ? "#eff6ff" : "#f0fdf4",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{item.drugs}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: item.severity === "moderate" ? "#fef3c7" : item.severity === "low" ? "#dbeafe" : "#dcfce7",
                            color: item.severity === "moderate" ? "#92400e" : item.severity === "low" ? "#1e40af" : "#166534",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={handleSend}
                disabled={sending || sent}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: sent
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #ec4899, #9333ea)",
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sent ? "✓ Sent to Dr. Carter!" : sending ? "Sending…" : "📧 Send to Provider"}
              </button>
              <button className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                🖨️ Print PDF
              </button>
            </div>

            {/* Footer note */}
            <div className="px-5 pb-4 text-center">
              <p className="text-xs text-gray-400">
                Report includes all active medications, dosages, frequencies, and AI-detected drug interactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
