export const HelpLinks = () => (
  <div className="space-y-3">
    {[
      "View Stripe receipts",
      "Dispute a charge",
      "Update billing information",
      "Contact support",
    ].map((link) => (
      <a
        key={link}
        href="#"
        className="block p-3 border rounded hover:bg-gray-50"
      >
        {link}
      </a>
    ))}
  </div>
);
