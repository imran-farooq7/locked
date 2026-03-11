// components/payments/payment-methods.tsx
export const SecurityNotice = () => (
  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
    <p className="font-medium mb-1">🔒 Secure Payment Processing</p>
    <p>
      Payment methods are securely stored with Stripe. LOCKED never stores your
      full card details. All transactions are PCI compliant.
    </p>
  </div>
);
