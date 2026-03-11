import { Download, ExternalLink } from "lucide-react";
import { PaymentRecord } from "./payment-history";
import Link from "next/link";
import { format } from "date-fns";

const STATUS_CONFIG = {
  charged: { color: "bg-green-100 text-green-800", icon: "💰" },
  refunded: { color: "bg-blue-100 text-blue-800", icon: "↩️" },
  failed: { color: "bg-red-100 text-red-800", icon: "❌" },
  pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
  all: { color: "bg-gray-100 text-gray-800", icon: "📝" },
} as const;
const PaymentCard = ({
  payment,
  onDownloadReceipt,
}: {
  payment: PaymentRecord;
  onDownloadReceipt: (chargeId: string) => void;
}) => {
  const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.all;

  return (
    <div className="border rounded-lg p-4 hover:border-gray-400">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{config.icon}</span>
            <div>
              <h4 className="font-medium">{payment.goal.title}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>{format(new Date(payment.created_at), "PPP p")}</span>
                <span>•</span>
                <span>{payment.reason}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <div
            className={`text-lg font-semibold ${
              payment.status === "refunded" ? "text-blue-600" : "text-gray-900"
            }`}
          >
            {payment.status === "refunded" ? "-" : ""}$
            {(payment.amount / 100).toFixed(2)}
          </div>
          <div className="flex items-center justify-end space-x-2 mt-2">
            <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
              {payment.status.toUpperCase()}
            </span>

            {payment.stripe_charge_id && (
              <>
                <button
                  onClick={() => onDownloadReceipt(payment.stripe_charge_id!)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Download receipt"
                  aria-label="Download receipt"
                >
                  <Download className="w-4 h-4" />
                </button>
                <Link
                  href={`https://dashboard.stripe.com/payments/${payment.stripe_charge_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-100 rounded"
                  title="View on Stripe"
                  aria-label="View on Stripe"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PaymentCard;
