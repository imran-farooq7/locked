// components/payments/payment-methods.tsx
"use client";

import { usePaymentMethods } from "@/hooks/use-payment";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AddPaymentForm } from "./AddPaymentForm";
import EmptyState from "./empty-state";
import { LoadingSkeleton } from "./LoadingSkeleton";
import PaymentMethodCard from "./payment-method-cards";
import { SecurityNotice } from "./SecurityNotice";

export default function PaymentMethods() {
  const [showAddForm, setShowAddForm] = useState(false);
  const {
    methods,
    isPending,
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultMethod,
  } = usePaymentMethods();

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleAdd = () => {
    addPaymentMethod();
    setShowAddForm(false);
  };

  if (isPending) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <p className="text-gray-600 text-sm">
            Manage how you pay for penalties
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          <span>Add Method</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AddPaymentForm
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Methods List */}
      {methods.length === 0 ? (
        <EmptyState onAdd={() => setShowAddForm(true)} />
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={() => setDefaultMethod(method.id)}
              onRemove={() => removePaymentMethod(method.id)}
              canRemove={!(method.isDefault && methods.length > 1)}
            />
          ))}
        </div>
      )}

      {/* Security Notice */}
      <SecurityNotice />
    </div>
  );
}
