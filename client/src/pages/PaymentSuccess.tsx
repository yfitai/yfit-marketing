import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-xl border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Payment Successful!
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Welcome to YFIT Pro! Your subscription is now active.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Confirmation ID</p>
              <p className="text-sm font-mono font-medium text-gray-700 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">What happens next?</h3>
            <ul className="space-y-2">
              {[
                "You will receive a confirmation email from Stripe",
                "Create your YFIT account using the same email you used at checkout",
                "Your Pro features will be automatically unlocked when you sign in",
                "The YFIT mobile app is coming soon — we'll email you at launch",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-6"
            onClick={() => window.location.href = "https://app.yfitai.com/signup"}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Your Account Now
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/"}
          >
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:support@yfitai.com" className="text-green-600 hover:underline">
              support@yfitai.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
