"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="max-w-sm rounded-2xl p-6"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          confirmRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-1 text-sm text-neutral-500">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="mt-2">{children}</div>}

        <DialogFooter className="mt-4 flex gap-2 sm:flex-row-reverse">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`h-11 flex-1 rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                : "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50"
            }`}
          >
            {confirmLabel}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2"
          >
            {cancelLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
