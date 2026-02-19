// components/auth/logout-button.tsx
"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth/logout";

const BUTTON_CLASS_NAME =
  "rounded-md border px-4 py-2 text-sm transition-opacity hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(logoutAction);
  };

  const buttonLabel = isPending ? "Signing out..." : "Sign Out";

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={BUTTON_CLASS_NAME}
      aria-label="Sign out of your account"
    >
      {buttonLabel}
    </button>
  );
}
