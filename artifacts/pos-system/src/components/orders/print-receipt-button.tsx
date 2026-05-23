"use client";

export function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 w-full rounded-md bg-black py-3 text-white print:hidden"
    >
      Print Receipt
    </button>
  );
}