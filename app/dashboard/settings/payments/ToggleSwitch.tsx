"use client";
export const ToggleSwitch = ({
  checked = false,
  onChange,
  label,
  description,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  description: string;
}) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium">{label}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        defaultChecked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
    </label>
  </div>
);
