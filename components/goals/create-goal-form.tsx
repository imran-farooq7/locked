// components/goals/create-goal-form.tsx
"use client";

import { useMemo, useReducer, useState } from "react";
import { createGoalAction } from "@/actions/goals/create-goal";
import { getNextMonday, calculateDailyDeadline } from "@/lib/goal-utils";
import { format } from "date-fns";

type ProofType = "text" | "image" | "file";
type Recurrence = "none" | "daily" | "weekly" | "monthly";

type FormState = {
  title: string;
  description: string;
  targetDate: string; // datetime-local value
  penaltyAmount: number; // cents
  proofRequired: boolean;
  proofType?: ProofType;
  recurrence: Recurrence;
  frequency: number;
};

const initialState = (): FormState => ({
  title: "",
  description: "",
  targetDate: format(getNextMonday(), "yyyy-MM-dd'T'HH:mm"),
  penaltyAmount: 1000, // cents = $10.00
  proofRequired: false,
  proofType: "text",
  recurrence: "none",
  frequency: 1,
});

type Action =
  | { type: "set"; field: keyof FormState; value: any }
  | { type: "reset" };

function reducer(state: FormState, action: Action): FormState {
  if (action.type === "reset") return initialState();
  return { ...state, [action.field]: action.value };
}

export default function CreateGoalForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const setField = (field: keyof FormState, value: any) =>
    dispatch({ type: "set", field, value });

  const buildFormData = (s: FormState) => {
    const form = new FormData();
    form.append("title", s.title);
    form.append("description", s.description ?? "");
    form.append("targetDate", s.targetDate);
    form.append("penaltyAmount", String(s.penaltyAmount));
    form.append("proofRequired", s.proofRequired ? "true" : "false");
    if (s.proofType) form.append("proofType", s.proofType);
    form.append("recurrence", s.recurrence);
    form.append("frequency", String(s.frequency));
    return form;
  };

  const quickDeadlineOptions = useMemo(
    () => [
      {
        label: "Tomorrow 9 PM",
        value: format(calculateDailyDeadline(21), "yyyy-MM-dd'T'HH:mm"),
      },
      {
        label: "Next Monday 9 AM",
        value: format(getNextMonday(), "yyyy-MM-dd'T'HH:mm"),
      },
      {
        label: "End of Week (Friday 5 PM)",
        getValue: () => {
          const friday = new Date();
          const day = friday.getDay();
          const diff = day <= 5 ? 5 - day : 12 - day;
          friday.setDate(friday.getDate() + diff);
          friday.setHours(17, 0, 0, 0);
          return format(friday, "yyyy-MM-dd'T'HH:mm");
        },
      },
    ],
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const form = buildFormData(state);
    const result = await createGoalAction(form as FormData);

    if (result.success) {
      dispatch({ type: "reset" });
      // TODO: replace with better UX (toast / redirect)
      alert("Goal created successfully!");
    } else if (result.errors) {
      setErrors(result.errors as Record<string, string[]>);
    } else if (result.error) {
      setErrors({ _form: [String(result.error)] });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Goal Title *</label>
        <input
          type="text"
          value={state.title}
          onChange={(e) => setField("title", e.target.value)}
          className="w-full border rounded-lg p-3"
          placeholder="What do you want to achieve?"
          required
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title[0]}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description (Optional)
        </label>
        <textarea
          value={state.description}
          onChange={(e) => setField("description", e.target.value)}
          className="w-full border rounded-lg p-3"
          rows={3}
          placeholder="Add more details about your goal..."
        />
      </div>

      {/* Deadline Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Deadline *</label>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {quickDeadlineOptions.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                setField(
                  "targetDate",
                  "getValue" in option ? option.getValue!() : option.value,
                )
              }
              className="text-sm border rounded p-2 hover:bg-gray-50"
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          type="datetime-local"
          value={state.targetDate}
          onChange={(e) => setField("targetDate", e.target.value)}
          className="w-full border rounded-lg p-3"
          required
          min={format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm")} // Tomorrow
        />
        {errors.targetDate && (
          <p className="text-red-500 text-sm mt-1">{errors.targetDate[0]}</p>
        )}
      </div>

      {/* Penalty Amount */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Penalty Amount *
        </label>
        <div className="flex items-center">
          <span className="mr-2">$</span>
          <input
            type="number"
            value={(state.penaltyAmount / 100).toFixed(2)}
            onChange={(e) => {
              const dollars = Number(e.target.value || 0);
              const cents = Math.round(dollars * 100);
              setField("penaltyAmount", cents);
            }}
            className="w-full border rounded-lg p-3"
            min="1"
            max="500"
            step="0.01"
            required
          />
        </div>
        <p className="text-gray-500 text-sm mt-1">
          You'll be charged this amount if you fail to complete the goal
        </p>
        {errors.penaltyAmount && (
          <p className="text-red-500 text-sm mt-1">{errors.penaltyAmount[0]}</p>
        )}
      </div>

      {/* Proof Requirements */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="proofRequired"
            checked={state.proofRequired}
            onChange={(e) => setField("proofRequired", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="proofRequired" className="font-medium">
            Require proof of completion
          </label>
        </div>

        {initialState().proofRequired && (
          <div className="ml-6">
            <label className="block text-sm font-medium mb-2">Proof Type</label>
            <div className="flex space-x-4">
              {(["text", "image", "file"] as const).map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="proofType"
                    value={type}
                    checked={state.proofType === type}
                    onChange={(e) =>
                      setField("proofType", e.target.value as ProofType)
                    }
                    className="mr-2"
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recurrence Settings */}
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium mb-3">Recurrence</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <select
              value={state.recurrence}
              onChange={(e) =>
                setField("recurrence", e.target.value as Recurrence)
              }
              className="w-full border rounded-lg p-3"
            >
              <option value="none">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {state.recurrence !== "none" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Every {state.frequency} {state.recurrence}(s)
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={state.frequency}
                onChange={(e) => setField("frequency", Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>{state.frequency}</span>
                <span>30</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
      >
        {isSubmitting ? "Creating Goal..." : "Create Goal & Authorize Payment"}
      </button>

      {/* Form-level Errors */}
      {errors._form && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {errors._form.map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}
    </form>
  );
}
