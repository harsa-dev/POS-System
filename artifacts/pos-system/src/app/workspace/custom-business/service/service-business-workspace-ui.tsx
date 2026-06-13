import type { ReactNode } from "react";

export function ServiceSectionCard({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ServicePill({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
