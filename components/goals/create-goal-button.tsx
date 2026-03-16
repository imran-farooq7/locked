"use client";

import { useEffect, useState } from "react";
import CreateGoalForm from "./create-goal-form";

const OPEN_BUTTON_CLASS =
  "rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90";

const CLOSE_BUTTON_CLASS =
  "rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50";

export default function CreateGoalButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={OPEN_BUTTON_CLASS}
      >
        Create Goal
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-8 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-goal-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 id="create-goal-title" className="text-xl font-semibold">
                Create a New Goal
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={CLOSE_BUTTON_CLASS}
                aria-label="Close create goal modal"
              >
                Close
              </button>
            </div>

            <CreateGoalForm setIsOpen={setIsOpen} />
          </div>
        </div>
      )}
    </>
  );
}
