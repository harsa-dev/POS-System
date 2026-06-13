import { ArrowLeft, BadgeCheck, Cookie, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

import { ROUTES } from "@/constants/routes";

type LegalPageKind = "privacy" | "terms" | "security" | "cookies";

type LegalPageProps = {
  kind: LegalPageKind;
};

const legalContent: Record<
  LegalPageKind,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: typeof ShieldCheck;
    sections: Array<{ title: string; body: string }>;
  }
> = {
  privacy: {
    eyebrow: "Privacy Policy · Dummy Draft",
    title: "Privacy Policy",
    description: "Draft halaman privasi untuk demo portfolio. Belum final, tapi cukup untuk bikin auth flow kelihatan seperti produk serius.",
    icon: ShieldCheck,
    sections: [
      { title: "Data yang disimpan", body: "Demo app dapat menyimpan nama, email, role, business profile, session, dan data operasional seperti order, inventory, invoice, cashflow, dan audit log." },
      { title: "Cara data digunakan", body: "Data dipakai untuk login, mengelola business workspace, menampilkan dashboard, mencatat aktivitas, dan menjaga akses tetap scoped ke business yang benar." },
      { title: "Provider pihak ketiga", body: "Google login dan payment provider masih dummy atau tahap awal. Kalau provider asli dipasang, halaman ini harus diperbarui." },
      { title: "Status dokumen", body: "Ini placeholder untuk development dan portfolio. Production copy harus direview ulang sebelum dipakai beneran." },
    ],
  },
  terms: {
    eyebrow: "Terms of Service · Dummy Draft",
    title: "Terms of Service",
    description: "Draft syarat penggunaan untuk demo SaaS. Isinya jelas, tapi belum menjadi dokumen final.",
    icon: FileText,
    sections: [
      { title: "Penggunaan akun", body: "User bertanggung jawab menjaga kredensial, aktivitas akun, dan data yang dimasukkan ke workspace." },
      { title: "Business workspace", body: "Setiap akun diarahkan ke satu business scope. Mode restaurant, retail, raw material, dan custom business memakai fondasi sistem yang sama." },
      { title: "Batasan demo", body: "Fitur dummy, OAuth dummy, dan payment sandbox tidak boleh dipakai untuk transaksi nyata." },
      { title: "Perubahan fitur", body: "Fitur dapat berubah selama development. Itu software, bukan batu prasasti." },
    ],
  },
  security: {
    eyebrow: "Security Overview · Dummy Draft",
    title: "Security Overview",
    description: "Ringkasan keamanan untuk demo. Belum audit final, tapi fondasi UI-nya sudah siap.",
    icon: LockKeyhole,
    sections: [
      { title: "Authentication", body: "Sistem memakai session-based authentication. Google login saat ini masih dummy UI dan belum melakukan OAuth asli." },
      { title: "Business isolation", body: "Arah arsitektur memakai businessId sebagai tenant scope utama untuk data operasional." },
      { title: "Audit trail", body: "Aktivitas penting seperti order, invoice, cashflow, inventory movement, dan perubahan status disiapkan untuk audit log." },
      { title: "Production checklist nanti", body: "Sebelum go-live, perlu review cookie, OAuth provider, backup, RBAC, monitoring, dan deployment config." },
    ],
  },
  cookies: {
    eyebrow: "Cookie Notice · Dummy Draft",
    title: "Cookie Notice",
    description: "Notice cookie dummy untuk auth UI. Karena web modern tentu belum cukup rumit tanpa halaman ini.",
    icon: Cookie,
    sections: [
      { title: "Cookie penting", body: "Cookie atau session penting dipakai agar user tetap login dan API dapat mengenali session." },
      { title: "Local storage", body: "Frontend dapat memakai localStorage untuk menyimpan pilihan business mode sementara seperti currentBusinessMode." },
      { title: "Analytics cookie", body: "Belum ada tracking analytics production di draft ini." },
      { title: "Status dokumen", body: "Ini placeholder UI. Cookie policy final harus mengikuti tool yang benar-benar dipakai." },
    ],
  },
};

const quickLinks = [
  { label: "Privacy", href: ROUTES.PRIVACY },
  { label: "Terms", href: ROUTES.TERMS },
  { label: "Security", href: ROUTES.SECURITY },
  { label: "Cookies", href: ROUTES.COOKIES },
];

export function LegalPage({ kind }: LegalPageProps) {
  const content = legalContent[kind];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
          <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur">
          <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
            <aside className="relative overflow-hidden bg-slate-950 p-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.42),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.3),transparent_30%),radial-gradient(circle_at_45%_90%,rgba(168,85,247,0.34),transparent_36%)]" />
              <div className="relative z-10 flex min-h-[420px] flex-col justify-between">
                <div>
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">{content.eyebrow}</p>
                  <h1 className="max-w-sm text-4xl font-semibold tracking-tight">{content.title}</h1>
                  <p className="mt-4 max-w-md text-sm leading-6 text-white/65">{content.description}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm leading-6 text-white/70">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    Demo legal layer
                  </div>
                  Placeholder ini siap dipakai buat flow auth, pitch UI, dan portfolio review.
                </div>
              </div>
            </aside>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
                <strong>Dummy notice:</strong> halaman ini cuma draft UI untuk development. Jangan pakai sebagai dokumen production final.
              </div>

              <div className="space-y-4">
                {content.sections.map((section) => (
                  <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">{section.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
                  </article>
                ))}
              </div>

              <p className="mt-8 text-xs leading-5 text-slate-400">
                Last updated: dummy development draft. Replace this with real company identity, support contact, retention period, and vendor list before production.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
