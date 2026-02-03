// app/dashboard/page.tsx
import UserInfo from "@/components/dashboard/user-info";
import { Suspense } from "react";

export default async function DashboardPage() {
  return (
    <main className="container mx-auto p-6">
      <header>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading user info...</div>}>
          <UserInfo />
        </Suspense>

        {/* Quick Actions */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full rounded-md bg-black px-4 py-2 text-white">
              Create New Goal
            </button>
            <button className="w-full rounded-md border px-4 py-2">
              View Active Goals
            </button>
            <button className="w-full rounded-md border px-4 py-2">
              Payment Settings
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
