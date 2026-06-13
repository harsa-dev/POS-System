"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Chrome, LockKeyhole, Mail, ShieldCheck, Sparkles, Store, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

import { ROUTES } from "@/constants/routes";
import { authApi, getApiErrorMessage } from "@/lib/api";

const GOOGLE_DUMMY_NAME = "Google Demo Owner";
const GOOGLE_DUMMY_EMAIL = "google.owner@test.com";
const GOOGLE_DUMMY_PASSWORD = "password123";

const infoLinks = [
  { label: "Privacy", href: ROUTES.PRIVACY },
  { label: "Terms", href: ROUTES.TERMS },
  { label: "Security", href: ROUTES.SECURITY },
  { label: "Cookies", href: ROUTES.COOKIES },
];

export function RegisterForm() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"credentials" | "google" | null>(null);

  async function register(payload: { name: string; email: string; password: string }, provider: "credentials" | "google") {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingProvider(provider);

    try {
      const data = await authApi.register(payload);

      if (!data.success) {
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success(provider === "google" ? "Google dummy account created. Please sign in." : "Account created. Please sign in.");
      setLocation(ROUTES.LOGIN);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await register(
      {
        name: name.trim(),
        email: email.trim(),
        password,
      },
      "credentials",
    );
  }

  async function signUpWithGoogleDummy() {
    await register(
      {
        name: GOOGLE_DUMMY_NAME,
        email: GOOGLE_DUMMY_EMAIL,
        password: GOOGLE_DUMMY_PASSWORD,
      },
      "google",
    );
  }

  const submitLabel = loadingProvider === "credentials" ? "Creating account..." : "Create account";
  const googleLabel = loadingProvider === "google" ? "Creating Google dummy..." : "Sign up with Google";

  return (
    <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur md:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10">
        <div className="mb-8">
          <p className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Start your business workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Create owner account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buat akun owner untuk masuk ke mode business. Satu akun, banyak mode bisnis. Akhirnya naming mulai waras, sebuah mukjizat kecil.
          </p>
        </div>

        <button
          type="button"
          onClick={signUpWithGoogleDummy}
          disabled={isLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Chrome className="h-5 w-5" />
          {googleLabel}
        </button>

        <div className="mb-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or create with email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Owner name</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
              <UserRound className="h-5 w-5 text-slate-400" />
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Leo Febrian"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
              <Mail className="h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@example.com"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
              <LockKeyhole className="h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                required
                minLength={8}
              />
            </span>
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          Dummy info pages tersedia untuk review portfolio: Privacy, Terms, Security, dan Cookies.
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mt-8 text-center text-sm text-slate-500">
          Sudah punya owner account?{" "}
          <Link href={ROUTES.LOGIN} className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4">
            Sign in
          </Link>
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-slate-200 pt-5">
          {infoLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
              {link.label}
            </Link>
          ))}
        </div>
      </form>

      <aside className="relative hidden min-h-[640px] overflow-hidden bg-slate-950 p-8 text-white md:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.42),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(34,197,94,0.34),transparent_30%),radial-gradient(circle_at_45%_88%,rgba(99,102,241,0.38),transparent_36%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Business OS</p>
                <p className="text-xs text-white/55">Clean business-mode foundation</p>
              </div>
            </div>

            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
                <Sparkles className="h-3.5 w-3.5" />
                Built for multiple business models
              </span>

              <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
                Mulai dari owner account, lalu pilih business mode.
              </h1>

              <p className="max-w-md text-sm leading-6 text-white/65">
                Register ini masih sederhana, tapi flow-nya sudah disiapkan untuk business root, bukan restaurant root. Karena kita sedang membangun sistem, bukan warung string restaurantId berkostum SaaS.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Auth info layer ready
            </div>
            <p className="text-sm leading-6 text-white/75">
              Dummy Google button dan dummy info pages sudah tersedia. Nanti tinggal diganti provider asli, bukan bongkar UI lagi dari nol.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
