"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { DEMO_ACCOUNTS, login, useSession } from "@/lib/auth";
import { roleLabel } from "@/lib/permissions";
import { Button } from "@/components/common/Button";
import { Field, Input } from "@/components/common/FormField";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].password);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-sidebar relative hidden flex-col items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-brand-900/40 blur-3xl" />
        <Image src="/logo-full.jpg" alt="Yaadhum International Technologies" width={520} height={416} priority className="relative mix-blend-lighten" />
        <p className="relative mt-6 max-w-md text-center text-sm leading-relaxed text-stone-400">
          One place for every lead, learner and team member — admissions, academics, HR and finance, beautifully
          connected.
        </p>
      </div>

      <div className="flex items-center justify-center bg-cream-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Image src="/logo-mark.jpg" alt="Yaadhum" width={72} height={72} className="logo-ring rounded-full" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-600">Yaadhum CRM</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to continue to your workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brand-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {error && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">{error}</p>}
            <Button type="submit" size="lg" loading={busy} className="w-full justify-center">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Demo accounts</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                  className="rounded-lg border border-brand-50 px-3 py-2 text-left transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="block text-xs font-semibold text-ink-900">{roleLabel(a.role)}</span>
                  <span className="block truncate text-[11px] text-stone-500">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-stone-400">© {new Date().getFullYear()} Yaadhum International Technologies</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
