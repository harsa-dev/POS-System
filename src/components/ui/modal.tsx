"use client";

import type { ReactNode } from "react";

import { X } from "lucide-react";

type ModalProps = {
  open: boolean;

  title: string;

  description?: string;

  children: ReactNode;

  onClose: () => void;

  maxWidth?: string;
};

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl no-scrollbar ${maxWidth}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-neutral-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}