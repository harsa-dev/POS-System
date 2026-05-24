"use client";

export function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 w-full rounded-md bg-primary py-3 text-primary-foreground hover:bg-primary/90 print:hidden"
    >
      Print Receipt
    </button>
  );
}