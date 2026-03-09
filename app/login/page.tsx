// app/login/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold mt-6">Welcome Back</h1>
          <p className="text-gray-600 mt-2">
            Continue your journey to achieving goals
          </p>
        </div>

        <LoginForm />

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-black font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          <div>
            <Link
              href="/forgot-password"
              className="text-sm text-gray-500 hover:text-black"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <h3 className="text-center font-medium mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">$450</div>
              <div className="text-sm text-gray-600">Avg Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm text-gray-600">Goals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
