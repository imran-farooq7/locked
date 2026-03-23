// app/dashboard/settings/payments/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PaymentMethods from "@/components/payments/payment-methods";
import PaymentHistory from "@/components/payments/payment-history";
import { CreditCard, History, Settings, Bell } from "lucide-react";
import { HelpLinks } from "./HelpLinks";
import { SidebarSection } from "./SidebarSection";
import { StatCard } from "./StatCard";
import { ToggleSwitch } from "./ToggleSwitch";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";
import Stats from "./Stats";
import { StripeProvider } from "@/lib/stripe/stripe-provider";

export default async function PaymentSettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your payment methods and view transaction history
        </p>
      </div>

      {/* Stats Overview */}
      <Suspense
        fallback={
          <div className="mb-8">
            <LoadingSkeleton />
          </div>
        }
      >
        <Stats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Payment Methods */}
          <div>
            <SidebarSection icon={CreditCard} title="Payment Methods">
              <StripeProvider>
                <PaymentMethods />
              </StripeProvider>
            </SidebarSection>
          </div>

          {/* Payment History */}
          <div>
            <SidebarSection icon={History} title="Payment History">
              <PaymentHistory limit={20} />
            </SidebarSection>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Payment Preferences */}
          <SidebarSection icon={Settings} title="Payment Preferences">
            <div className="space-y-4">
              <ToggleSwitch
                label="Auto-pay penalties"
                description="Automatically charge failed penalties"
                checked
              />
              <ToggleSwitch
                label="Payment reminders"
                description="Email reminders before penalties"
                checked
              />
              <ToggleSwitch
                label="Receipt emails"
                description="Send receipts after each charge"
                checked
              />
            </div>
          </SidebarSection>

          {/* Notifications */}
          <SidebarSection icon={Bell} title="Payment Notifications">
            <div className="space-y-4">
              <ToggleSwitch
                label="Successful charges"
                description="When a penalty is charged"
                checked
              />
              <ToggleSwitch
                label="Failed charges"
                description="When a charge fails"
                checked
              />
              <ToggleSwitch
                label="Refunds issued"
                description="When a refund is processed"
                checked
              />
            </div>
          </SidebarSection>

          {/* Help & Support */}
          <SidebarSection icon={Bell} title="Payment Help">
            <HelpLinks />
          </SidebarSection>
        </div>
      </div>
    </div>
  );
}
