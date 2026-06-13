"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Chrome, LockKeyhole, Mail, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

import { useAuth } from "@/App";
import { ROUTES } from "@/constants/routes";
import { authApi, getApiErrorMessage } from "@/lib/api";

const DEMO_EMAIL = "owner@test.com";
const DEMO_PASSWORD = "password123";

export function LoginForm() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"credentials" | "demo" | "google" | null>(null);

  async function login(emailValue: string, passwordValue: string, provider: "credentials" | "demo" | "google") {
    if (isLoading) return;

    if (!emailValue.trim() || !passwordValue.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);
    setLoadingProvider(provider);

    try {
      const data = await authApi.login({
        email: emailValue.trim(),
        password: passwordValue,
      });

      if (!data.success) {
        toast.error(data.message || "Login failed");
        return;
      }

      if (provider === "google") {
        toast.success("Google dummy login active. OAuth asli nanti disambung.");
      }

      await refetch();
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      console.error("[LOGIN_FORM_ERROR]", error);
      toast.error(getApiErrorMessage(error, "An error occurred during login"));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password, "credentials");
  }

  async function loginAsDemo() {
    await login(DEMO_EMAIL, DEMO_PASSWORD, "demo");
  }

  async function loginWithGoogleDummy() {
    await login(DEMO_EMAIL, DEMO_PASSWORD, "google");
  }

  const submitLabel = loadingProvider === "credentials" ? "Signing in..." : "Sign in";
  const googleLabel = loadingProvider === "google" ? "Connecting Google..." : "Continue with Google";
  const demoLabel = loadingProvider === "demo" ? "Opening demo..." : "Use demo owner";

  return (
    <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-slate-950/10 backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden min-h-[620px] overflow-hidden bg-slate-950 p-8 text-white md:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.45),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.35),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(168,85,247,0.35),transparent_34%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Business OS</p>
                <p className="text-xs text-white/55">Multi-mode operation workspace</p>
              </div>
            </div>

            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
                <Sparkles className="h-3.5 w-3.5" />
                Restaurant, retail, raw material, custom business
              </span>

              <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
                Sign in ke workspace operasional yang mulai kelihatan seperti produk beneran.
              </h1>

              <p className="max-w-md text-sm leading-6 text-white/65">
                Kelola order, inventory, cashflow, laporan, dan mode bisnis dari satu sistem. Masih portofolio, tapi setidaknya tidak terlihat seperti form login warisan tahun 2012.
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white/75">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <span>Business scoped access</span>
            </div>
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-sky-300" />
              <span>Session based authentication</span>
            </div>
          </div>
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10">
        <div className="mb-8">
          <p className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Welcome back
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Login account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Masuk untuk lanjut ke dashboard bisnis. Jangan khawatir, tombol Google masih dummy dulu, karena OAuth sungguhan butuh setup, bukan doa.
          </p>
        </div>

        <button
          type="button"
          onClick={loginWithGoogleDummy}
          disabled={isLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Chrome className="h-5 w-5" />
          {googleLabel}
        </button>

        <div className="mb-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or sign in with email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
              <Mail className="h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="owner@test.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
              <LockKeyhole className="h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="password123"
              />
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={loginAsDemo}
          disabled={isLoading}
          className="mt-3 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {demoLabel}
        </button>

        <p className="mt-8 text-center text-sm text-slate-500">
          Belum punya owner account?{" "}
          <Link href={ROUTES.REGISTER} className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4">
            Register
          </Link>
        </p>
      </form>
    </section>
  );
}
