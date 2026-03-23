"use client";
export function QuickActions() {
  const actions = [
    { label: "View Proof History", action: () => {} },
    {
      label: "Download All Proofs",
      action: () => {},
    },
    {
      label: "Request Proof Review",
      action: () => {},
    },
  ];

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
