// app/signup/page.tsx
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import SignupForm from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-black"
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold">LOCKED</span>
            </Link>
            <h1 className="text-3xl font-bold mt-6">Create Your Account</h1>
            <p className="text-gray-600 mt-2">
              Start achieving your goals with financial accountability
            </p>
          </div>

          <SignupForm />

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              By signing up, you agree to our{" "}
              <a href="#" className="text-black underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-black underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white p-12">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold mb-8">Why Join LOCKED?</h2>

          <div className="space-y-6 mb-12">
            {[
              "94% of users achieve their goals when money is on the line",
              "Average user saves $450 by completing goals instead of paying penalties",
              "No subscription fees - only pay when you fail",
              "Secure, automated system powered by Stripe",
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-1" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/20 pt-8">
            <h3 className="text-xl font-bold mb-4">Popular Goals on LOCKED</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { category: "Fitness", amount: "$500" },
                { category: "Learning", amount: "$300" },
                { category: "Writing", amount: "$750" },
                { category: "Business", amount: "$1,000" },
              ].map((goal, index) => (
                <div key={index} className="bg-white/10 p-4 rounded-lg">
                  <div className="text-sm text-white/80">{goal.category}</div>
                  <div className="text-lg font-bold">{goal.amount}</div>
                  <div className="text-xs text-white/60">avg. penalty</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
