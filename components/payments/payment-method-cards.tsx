import { PaymentMethod } from "@/hooks/use-payment";
import { Check, Trash2 } from "lucide-react";
const BRAND_ICONS: Record<string, string> = {
  visa: "💳",
  mastercard: "💳",
  amex: "💳",
  discover: "💳",
};

const PaymentMethodCard = ({
  method,
  onSetDefault,
  onRemove,
  canRemove,
}: {
  method: PaymentMethod;
  onSetDefault: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) => (
  <div
    className={`border rounded-lg p-4 ${
      method.isDefault ? "border-black" : ""
    }`}
  >
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="text-2xl">
          {BRAND_ICONS[method.brand.toLowerCase()] || "💳"}
        </div>
        <div>
          <div className="font-medium">
            {method.brand.toUpperCase()} •••• {method.last4}
          </div>
          <div className="text-sm text-gray-600">
            Expires {method.exp_month}/{method.exp_year}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {method.isDefault ? (
          <span className="flex items-center text-sm text-green-600">
            <Check className="w-4 h-4 mr-1" />
            Default
          </span>
        ) : (
          <button
            onClick={onSetDefault}
            className="text-sm text-gray-600 hover:text-black"
          >
            Set as default
          </button>
        )}

        <button
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
          disabled={!canRemove}
          aria-label="Remove payment method"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);
export default PaymentMethodCard;
