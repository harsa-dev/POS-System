"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/App";
import { apiFetch } from "@/lib/api";

export function LoginForm() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const DEMO_EMAIL = "owner@test.com";
  const DEMO_PASSWORD = "password123";

  async function login(emailValue: string, passwordValue: string) {
    if (isLoading) return;

    if (!emailValue.trim() || !passwordValue.trim()) {
      alert("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailValue.trim(),
          password: passwordValue,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Login gagal.");
        return;
      }

      console.log(import.meta.env.VITE_API_URL);
      
      await refetch();
      navigate("/dashboard");
    } catch (error) {
      console.error("[LOGIN_FORM_ERROR]", error);
      alert("Terjadi error saat login.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await login(email, password);
  }

  async function loginAsDemo() {
    await login(DEMO_EMAIL, DEMO_PASSWORD);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-xl border p-6"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>

        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          placeholder="********"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-black py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <button
        type="button"
        onClick={loginAsDemo}
        disabled={isLoading}
        className="w-full rounded-md border py-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Login as Demo Owner
      </button>

      <p className="text-center text-sm text-neutral-500">
        Belum punya owner account?{" "}
        <Link href="/register" className="font-medium text-black underline">
          Register
        </Link>
      </p>
    </form>
  );
}