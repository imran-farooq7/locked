// components/proof/proof-settings-form.tsx
"use client";

import { useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Save, AlertCircle, HelpCircle, Check } from "lucide-react";

interface ProofSettingsFormProps {
  initialPreferences: {
    default_proof_type: "text" | "image" | "file";
    require_proof_for_all: boolean;
    auto_verify_small_goals: boolean;
    small_goal_threshold: number; // in cents
    proof_reminder_hours: number;
    allow_file_uploads: boolean;
    max_file_size_mb: number;
    allowed_file_types: string[];
  };
}

// Static data hoisted outside component
const PROOF_TYPES = [
  {
    id: "text" as const,
    label: "Text Description",
    description: "Users describe their achievement in text",
  },
  {
    id: "image" as const,
    label: "Image Upload",
    description: "Users upload photos as proof",
  },
  {
    id: "file" as const,
    label: "File Upload",
    description: "Users upload any file type",
  },
];

const FILE_TYPES = [
  { value: "image/jpeg", label: "JPEG Images" },
  { value: "image/png", label: "PNG Images" },
  { value: "image/gif", label: "GIF Images" },
  { value: "application/pdf", label: "PDF Documents" },
  { value: "application/msword", label: "Word Documents" },
  { value: "text/plain", label: "Text Files" },
];

// Sub-components
function ProofTypeSelector({
  selectedType,
  onChange,
}: {
  selectedType: string;
  onChange: (type: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PROOF_TYPES.map((type) => (
        <div
          key={type.id}
          onClick={() => onChange(type.id)}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedType === type.id
              ? "border-black bg-black/5"
              : "hover:border-gray-400"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{type.label}</div>
              <div className="text-sm text-gray-600 mt-1">
                {type.description}
              </div>
            </div>
            {selectedType === type.id && (
              <Check className="w-5 h-5 text-green-600" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
      </label>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  error,
  helpText,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  helpText?: string;
  prefix?: string;
}) {
  return (
    <div className="max-w-xs">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center">
        {prefix && <span className="mr-2">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2"
          min={min}
          max={max}
          step={step}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helpText && <p className="text-xs text-gray-500 mt-2">{helpText}</p>}
    </div>
  );
}

function FileTypeSelector({
  selectedTypes,
  onToggle,
  error,
}: {
  selectedTypes: string[];
  onToggle: (type: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-3">
        Allowed file types
      </label>
      <div className="space-y-2">
        {FILE_TYPES.map((type) => (
          <label key={type.value} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type.value)}
              onChange={() => onToggle(type.value)}
              className="rounded"
            />
            <span className="text-sm">{type.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

function SaveButton({
  onSave,
  isSaving,
  disabled,
  success,
}: {
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
  success: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div>
        {success && (
          <span className="text-green-600 text-sm flex items-center">
            <Check className="w-4 h-4 mr-1" />
            Settings saved successfully!
          </span>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={disabled}
        className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        <span>{isSaving ? "Saving..." : "Save Settings"}</span>
      </button>
    </div>
  );
}

export default function ProofSettingsForm({
  initialPreferences,
}: ProofSettingsFormProps) {
  const [settings, setSettings] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = createSupabaseClient();

  const validateSettings = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (settings.small_goal_threshold < 100) {
      newErrors.small_goal_threshold = "Threshold must be at least $1.00";
    }

    if (settings.proof_reminder_hours < 1) {
      newErrors.proof_reminder_hours = "Reminder hours must be at least 1";
    }

    if (settings.max_file_size_mb < 1 || settings.max_file_size_mb > 50) {
      newErrors.max_file_size_mb = "File size must be between 1-50 MB";
    }

    if (settings.allowed_file_types.length === 0) {
      newErrors.allowed_file_types = "Select at least one file type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [settings]);

  const handleSave = useCallback(async () => {
    if (!validateSettings()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Save to user_preferences table (create if not exists)
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        proof_settings: settings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [validateSettings, supabase, settings]);

  const handleChange = useCallback(
    (field: keyof typeof settings, value: unknown) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
      setSaveSuccess(false);
    },
    [],
  );

  const handleFileTypeToggle = useCallback((type: string) => {
    setSettings((prev) => {
      const newTypes = prev.allowed_file_types.includes(type)
        ? prev.allowed_file_types.filter((t) => t !== type)
        : [...prev.allowed_file_types, type];
      return { ...prev, allowed_file_types: newTypes };
    });
    setSaveSuccess(false);
  }, []);

  return (
    <div className="space-y-8">
      {/* Default Proof Type */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Default Proof Type
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
          </h3>
          <p className="text-sm text-gray-600">
            Choose how users will typically submit proof
          </p>
        </div>
        <ProofTypeSelector
          selectedType={settings.default_proof_type}
          onChange={(type) => handleChange("default_proof_type", type)}
        />
      </div>

      {/* Auto-verification Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Auto-Verification Rules</h3>
          <p className="text-sm text-gray-600">
            Configure automatic proof verification
          </p>
        </div>

        <div className="space-y-4">
          <ToggleSetting
            title="Require proof for all goals"
            description="When enabled, all goals will require proof by default"
            checked={settings.require_proof_for_all}
            onChange={(checked) =>
              handleChange("require_proof_for_all", checked)
            }
          />

          <ToggleSetting
            title="Auto-verify small goals"
            description="Automatically approve proof for goals below the threshold"
            checked={settings.auto_verify_small_goals}
            onChange={(checked) =>
              handleChange("auto_verify_small_goals", checked)
            }
          />

          {settings.auto_verify_small_goals && (
            <div className="ml-8 p-4 bg-gray-50 rounded-lg">
              <NumberInput
                label="Small goal threshold"
                value={settings.small_goal_threshold / 100}
                onChange={(value) =>
                  handleChange("small_goal_threshold", Math.round(value * 100))
                }
                min={1}
                max={100}
                step={0.01}
                prefix="$"
                error={errors.small_goal_threshold}
                helpText="Goals with penalty amounts below this threshold will be auto-verified"
              />
            </div>
          )}
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Proof Reminders</h3>
          <p className="text-sm text-gray-600">
            Configure when to send proof reminders
          </p>
        </div>

        <NumberInput
          label="Send reminder hours before deadline"
          value={settings.proof_reminder_hours}
          onChange={(value) => handleChange("proof_reminder_hours", value)}
          min={1}
          max={72}
          error={errors.proof_reminder_hours}
        />
      </div>

      {/* File Upload Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">File Upload Settings</h3>
          <p className="text-sm text-gray-600">
            Configure file upload requirements
          </p>
        </div>

        <div className="space-y-4">
          <ToggleSetting
            title="Allow file uploads"
            description="Enable or disable file uploads for proof submission"
            checked={settings.allow_file_uploads}
            onChange={(checked) => handleChange("allow_file_uploads", checked)}
          />

          {settings.allow_file_uploads && (
            <>
              <NumberInput
                label="Maximum file size (MB)"
                value={settings.max_file_size_mb}
                onChange={(value) => handleChange("max_file_size_mb", value)}
                min={1}
                max={50}
                error={errors.max_file_size_mb}
              />

              <FileTypeSelector
                selectedTypes={settings.allowed_file_types}
                onToggle={handleFileTypeToggle}
                error={errors.allowed_file_types}
              />
            </>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Proof Settings</p>
            <p>
              These settings apply to all new goals you create. You can always
              override them for individual goals when creating or editing them.
            </p>
          </div>
        </div>
      </div>

      <SaveButton
        onSave={handleSave}
        isSaving={isSaving}
        disabled={isSaving || Object.keys(errors).length > 0}
        success={saveSuccess}
      />
    </div>
  );
}
