"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type NewAccountFormProps = {
  hasOrg: boolean;
};

type FormState = {
  name: string;
  industry: string;
  website: string;
};

export function NewAccountForm({ hasOrg }: NewAccountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    industry: "",
    website: "",
  });

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasOrg) {
      setError("Brak org_id w sesji. Najpierw napraw mapowanie user -> org.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/prospecting/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry || null,
          website: form.website || null,
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Nie udalo sie zapisac account.");
      }

      setForm({ name: "", industry: "", website: "" });
      setSuccess("Account zapisane. Odswiezam liste kont...");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unknown error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">New Account</h2>
      <p className="mt-2 text-sm text-slate-600">Najpierw tworzysz konto, potem dodajesz opportunity przypiete do konta.</p>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      {success ? (
        <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}

      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2">
          Name
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="np. Acme Sp. z o.o."
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Industry
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.industry}
            onChange={(event) => update("industry", event.target.value)}
            placeholder="np. Manufacturing"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Website
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Saving..." : "Create Account"}
          </button>
        </div>
      </form>
    </section>
  );
}
