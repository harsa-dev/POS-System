"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { ROUTES } from "@/constants/routes";

export function RegisterForm() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);

    try {
      const data = await authApi.register({
        name,
        email,
        password,
      });

      if (!data.success) {
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success("Account created! Please sign in.");
      setLocation(ROUTES.LOGIN);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6"
    >
      <h1 className="text-xl font-bold">Create Owner Account</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded-md border px-3 py-2"
        required
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-md border px-3 py-2"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-md border px-3 py-2"
        required
        minLength={8}
      />

      <button
        disabled={isLoading}
        className="w-full rounded-md bg-primary py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Register"}
      </button>

      <p className="text-center text-sm text-neutral-500">
              sudah punya owner account?{" "}
              <Link href="/login" className="font-medium text-primary underline">
                Sign up
              </Link>
            </p>
    </form>
  );
}
