"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AccountOption = {
  id: string;
  name: string;
};

type NewOpportunityFormProps = {
  orgId: string | null;
  accounts: AccountOption[];
};

type FormState = {
  accountId: string;
  title: string;
  projectType: string;
  trainingDays: string;
  stage: string;
  probability: string;
  valuePln: string;
};

const DEFAULT_STAGE = "target";
const DEFAULT_PROJECT_TYPE = "academy";

export function NewOpportunityForm({ orgId, accounts }: NewOpportunityFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initialAccount = useMemo(() => accounts[0]?.id ?? "", [accounts]);

  const [form, setForm] = useState<FormState>({
    accountId: initialAccount,
    title: "",
    projectType: DEFAULT_PROJECT_TYPE,
    trainingDays: "3",
    stage: DEFAULT_STAGE,
    probability: "50",
    valuePln: "",
  });

  const canSubmit = Boolean(orgId) && accounts.length > 0 && !isSubmitting;

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!orgId) {
      setError("Brak org_id. Najpierw napraw mapowanie user -> org.");
      return;
    }

    if (!form.accountId) {
      setError("Wybierz konto.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        org_id: orgId,
        account_id: form.accountId,
        title: form.title,
        project_type: form.projectType,
        training_days: Number(form.trainingDays),
        stage: form.stage,
        probability: Number(form.probability),
        value_pln: form.valuePln ? Number(form.valuePln) : null,
      };

      const response = await fetch("/api/v1/prospecting/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Nie udalo sie zapisac opportunity.");
      }

      setForm((prev) => ({
        ...prev,
        title: "",
        trainingDays: "3",
        probability: "50",
        valuePln: "",
      }));
      setSuccess("Opportunity zapisane. Odswiezam KPI...");
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
      <h2 className="text-sm font-semibold text-slate-900">New Opportunity</h2>
      <p className="mt-2 text-sm text-slate-600">Szybkie dodanie rekordu bez SQL i bez wychodzenia z dashboardu.</p>

      {accounts.length === 0 ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Brak kont w prospecting_accounts. Najpierw dodaj account, potem utworz opportunity.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      {success ? (
        <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}

      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2">
          Account
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.accountId}
            onChange={(event) => update("accountId", event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2">
          Title
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="np. Szkolenie sprzedazowe Q3"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Project Type
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.projectType}
            onChange={(event) => update("projectType", event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Stage
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.stage}
            onChange={(event) => update("stage", event.target.value)}
          >
            <option value="target">target</option>
            <option value="qualified">qualified</option>
            <option value="proposal">proposal</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Training Days
          <input
            type="number"
            min="0.5"
            step="0.5"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.trainingDays}
            onChange={(event) => update("trainingDays", event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Probability (0-100)
          <input
            type="number"
            min="0"
            max="100"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.probability}
            onChange={(event) => update("probability", event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2">
          Value PLN (optional)
          <input
            type="number"
            min="0"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
            value={form.valuePln}
            onChange={(event) => update("valuePln", event.target.value)}
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Saving..." : "Create Opportunity"}
          </button>
        </div>
      </form>
    </section>
  );
}
