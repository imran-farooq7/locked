// components/payments/payment-history.tsx
"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ExternalLink, Download, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PaymentHistoryProps {
  limit?: number;
}

interface PaymentRecord {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: "charged" | "refunded" | "failed" | "pending" | "all";
  reason: string;
  stripe_charge_id?: string;
  stripe_invoice_id?: string;
  goal: {
    title: string;
    id: string;
  };
}

export default function PaymentHistory({ limit = 10 }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "charged" | "refunded" | "failed"
  >("all");

  const supabase = createSupabaseClient();

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    setLoading(true);

    let query = supabase
      .from("penalty_charges")
      .select(
        `
        *,
        goal:goals(title, id)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setPayments(data as PaymentRecord[]);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "charged":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "charged":
        return "💰";
      case "refunded":
        return "↩️";
      case "failed":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "📝";
    }
  };

  const downloadReceipt = async (chargeId: string) => {
    // This would fetch receipt from Stripe API
    alert(`Receipt for charge ${chargeId} would be downloaded`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No payment history found</p>
        <p className="text-sm text-gray-500 mt-2">
          {filter !== "all"
            ? "Try changing the filter"
            : "Penalties will appear here when charged"}
        </p>
      </div>
    );
  }

  const totalCharged = payments
    .filter((p) => p.status === "charged")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{payments.length}</div>
          <div className="text-gray-600">Total Payments</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            ${(totalCharged / 100).toFixed(2)}
          </div>
          <div className="text-gray-600">Total Charged</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            ${(totalRefunded / 100).toFixed(2)}
          </div>
          <div className="text-gray-600">Total Refunded</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">
            ${((totalCharged - totalRefunded) / 100).toFixed(2)}
          </div>
          <div className="text-gray-600">Net Total</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 border-b">
        {(["all", "charged", "refunded", "failed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium capitalize ${
              filter === status
                ? "border-b-2 border-black text-black"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {status}{" "}
            {status !== "all" && (
              <span className="ml-1 text-sm">
                ({payments.filter((p) => p.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="border rounded-lg p-4 hover:border-gray-400"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {getStatusIcon(payment.status)}
                  </span>
                  <div>
                    <h4 className="font-medium">{payment.goal.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>
                        {format(new Date(payment.created_at), "PPP p")}
                      </span>
                      <span>•</span>
                      <span>{payment.reason}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <div
                  className={`text-lg font-semibold ${
                    payment.status === "refunded"
                      ? "text-blue-600"
                      : "text-gray-900"
                  }`}
                >
                  {payment.status === "refunded" ? "-" : ""}$
                  {(payment.amount / 100).toFixed(2)}
                </div>
                <div className="flex items-center justify-end space-x-2 mt-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}
                  >
                    {payment.status.toUpperCase()}
                  </span>

                  {payment.stripe_charge_id && (
                    <>
                      <button
                        onClick={() =>
                          downloadReceipt(payment.stripe_charge_id!)
                        }
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Download receipt"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Link
                        href={`https://dashboard.stripe.com/payments/${payment.stripe_charge_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View on Stripe"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
