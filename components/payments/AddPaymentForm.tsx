// components/payments/payment-methods.tsx
"use client";
export const AddPaymentForm = ({
  onAdd,
  onCancel,
}: {
  onAdd: () => void;
  onCancel: () => void;
}) => (
  <div className="border rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h4 className="font-medium">Add Payment Method</h4>
      <button
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-700"
        aria-label="Cancel"
      >
        ✕
      </button>
    </div>

    {/* Stripe Elements would go here */}
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Card Number</label>
        <input
          type="text"
          placeholder="4242 4242 4242 4242"
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Expiration</label>
          <input
            type="text"
            placeholder="MM/YY"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">CVC</label>
          <input
            type="text"
            placeholder="123"
            className="w-full border rounded-lg p-3"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onAdd}
          className="flex-1 bg-black text-white rounded-lg py-3 font-medium"
        >
          Add Card
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border rounded-lg font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);
