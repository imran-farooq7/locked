"use client";

import { useCallback, useTransition, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Validation functions
const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);
const isValidPassword = (password: string): boolean =>
  password.length >= MIN_PASSWORD_LENGTH;

// Extract form data with validation
interface LoginCredentials {
  email: string;
  password: string;
}

function extractCredentials(formData: FormData): LoginCredentials {
  return {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };
}

function validateCredentials(credentials: LoginCredentials): {
  valid: boolean;
  error?: string;
} {
  if (!credentials.email) {
    return { valid: false, error: "Email is required" };
  }

  if (!isValidEmail(credentials.email)) {
    return { valid: false, error: "Invalid email format" };
  }

  if (!credentials.password) {
    return { valid: false, error: "Password is required" };
  }

  if (!isValidPassword(credentials.password)) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);

      startTransition(async () => {
        try {
          const credentials = extractCredentials(formData);
          const validation = validateCredentials(credentials);

          if (!validation.valid) {
            setError(validation.error || "Invalid credentials");
            return;
          }

          const supabase = createSupabaseClient();
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError) throw authError;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Login failed";
          setError(errorMessage);
        }
      });
    },
    [setError],
  );

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={isPending}
          className="mt-1 block w-full rounded-md border p-2 disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={isPending}
          minLength={MIN_PASSWORD_LENGTH}
          className="mt-1 block w-full rounded-md border p-2 disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-black px-4 py-2 font-medium text-white transition-opacity disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
