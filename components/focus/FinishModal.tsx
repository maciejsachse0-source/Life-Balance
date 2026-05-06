"use client";

import { useState } from "react";
import { Modal } from "../Modal";

type Props = {
  open: boolean;
  onAnswer: (completed: boolean) => void;
};

export function FinishModal({ open, onAnswer }: Props) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal open={open} onClose={() => {}} title="Koniec slotu">
      <div className="text-center space-y-5">
        <p className="text-neutral-700">
          <span className="block text-lg font-medium mb-1">
            Spędziłeś ten czas nad zadaniem które chciałeś?
          </span>
          <span className="text-sm text-neutral-500">
            Apka liczy tylko zero-jedynkowy ślad — nie godziny.
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={submitting}
            onClick={() => {
              setSubmitting(true);
              onAnswer(false);
            }}
            className="px-4 py-3 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Nie
          </button>
          <button
            disabled={submitting}
            onClick={() => {
              setSubmitting(true);
              onAnswer(true);
            }}
            className="px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Tak
          </button>
        </div>
      </div>
    </Modal>
  );
}
