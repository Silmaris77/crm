import { Suspense } from "react";

import { getSupabaseServerClient } from "@/lib/supabase";
import { AccountsList } from "@/components/accounts-list";
import { NewAccountForm } from "@/components/new-account-form";
import { NewOpportunityForm } from "@/components/new-opportunity-form";
import { RecentOpportunitiesList } from "@/components/recent-opportunities-list";

type OpportunityRow = {
  id: string;
  title: string;
  stage: string;
  training_days: number;
  weighted_days: number;
  value_pln: number | null;
  created_at?: string;
};

type AccountOption = {
  id: string;
  name: string;
};

type DashboardState = {
  isAuthenticated: boolean;
  userId: string | null;
  orgId: string | null;
  error: string | null;
  opportunitiesTotal: number;
  trainingDaysTotal: number;
  weightedDaysTotal: number;
  pipelineValueTotal: number;
  accounts: AccountOption[];
  opportunityItems: OpportunityRow[];
};

const EMPTY_STATE: DashboardState = {
  isAuthenticated: false,
  userId: null,
  orgId: null,
  error: null,
  opportunitiesTotal: 0,
  trainingDaysTotal: 0,
  weightedDaysTotal: 0,
  pipelineValueTotal: 0,
  accounts: [],
  opportunityItems: [],
};

async function getDashboardState(): Promise<DashboardState> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return {
        ...EMPTY_STATE,
        error: authError.message,
      };
    }

    if (!user) {
      return EMPTY_STATE;
    }

    const { data: orgIdData, error: orgIdError } = await supabase.rpc("current_org_id");

    if (orgIdError) {
      return {
        ...EMPTY_STATE,
        isAuthenticated: true,
        error: `RLS check failed: ${orgIdError.message}`,
      };
    }

    const orgId = typeof orgIdData === "string" ? orgIdData : null;

    if (!orgId) {
      return {
        ...EMPTY_STATE,
        isAuthenticated: true,
        userId: user.id,
        error: "Brak org_id w JWT. RLS zwroci puste wyniki, dopoki nie dodasz claimu org_id.",
      };
    }

    const { data: accountsData, error: accountsError } = await supabase
      .from("prospecting_accounts")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (accountsError) {
      return {
        ...EMPTY_STATE,
        isAuthenticated: true,
        userId: user.id,
        orgId,
        error: accountsError.message,
      };
    }

    const accounts = (accountsData ?? []) as AccountOption[];

    const { data, error } = await supabase
      .from("prospecting_opportunities")
      .select("id, title, stage, training_days, weighted_days, value_pln, created_at")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        ...EMPTY_STATE,
        isAuthenticated: true,
        userId: user.id,
        orgId,
        accounts,
        error: error.message,
      };
    }

    const rows = (data ?? []) as OpportunityRow[];

    const totals = rows.reduce(
      (acc, row) => {
        acc.trainingDays += row.training_days ?? 0;
        acc.weightedDays += row.weighted_days ?? 0;
        acc.pipelineValue += row.value_pln ?? 0;
        return acc;
      },
      { trainingDays: 0, weightedDays: 0, pipelineValue: 0 }
    );

    return {
      isAuthenticated: true,
      userId: user.id,
      orgId,
      error: null,
      opportunitiesTotal: rows.length,
      trainingDaysTotal: totals.trainingDays,
      weightedDaysTotal: totals.weightedDays,
      pipelineValueTotal: totals.pipelineValue,
      accounts,
      opportunityItems: rows,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ...EMPTY_STATE,
      error: message,
    };
  }
}

function formatPln(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Home() {
  const dashboard = await getDashboardState();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-14 sm:px-10">
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(140deg,#102c64_0%,#1f4f91_52%,#2c6db5_100%)] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <p className="mb-3 inline-block rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/90">
          Phase 2 active
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">CRM Prospecting</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/90 sm:text-base">
          Migracje, API opportunities i KPI dashboard sa gotowe. Ponizej widzisz dane
          przypisane do aktualnej sesji uzytkownika.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Session</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {dashboard.isAuthenticated ? "Active" : "No session"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            User: {dashboard.userId ? dashboard.userId : "missing"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Org: {dashboard.orgId ? dashboard.orgId : "missing"}
          </p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Opportunities</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{dashboard.opportunitiesTotal}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Training Days</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{dashboard.trainingDaysTotal}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Value</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPln(dashboard.pipelineValueTotal)}</p>
        </article>
      </section>

      {dashboard.error ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <h2 className="text-sm font-semibold">Status</h2>
          <p className="mt-2 text-sm">{dashboard.error}</p>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <NewAccountForm hasOrg={Boolean(dashboard.orgId)} />
        <NewOpportunityForm orgId={dashboard.orgId} accounts={dashboard.accounts} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm text-sm text-slate-600">Loading accounts...</section>}>
          <AccountsList items={dashboard.accounts} />
        </Suspense>
        <Suspense fallback={<section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm text-sm text-slate-600">Loading opportunities...</section>}>
          <RecentOpportunitiesList items={dashboard.opportunityItems} />
        </Suspense>
      </section>
    </main>
  );
}
