import { CreditCard } from "lucide-react";

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="rounded-lg border border-dashed p-12 text-center">
    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600">No payment methods added</p>
    <p className="text-sm text-gray-500 mt-2">
      Add a payment method to start creating goals
    </p>
    <button
      onClick={onAdd}
      className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
    >
      Add Method
    </button>
  </div>
);
export default EmptyState;
