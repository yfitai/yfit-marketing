import { useState, useEffect } from "react";

const COOKIE_KEY = "yfit_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't flash on first paint
    const timer = setTimeout(() => {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">🍪</div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-relaxed">
            We use cookies to improve your experience, analyze site traffic, and support our analytics. 
            By clicking <strong className="text-white">Accept</strong>, you agree to our use of cookies.{" "}
            <a
              href="/privacy"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
