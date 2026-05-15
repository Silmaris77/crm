import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";

type OpportunityRow = {
  stage: string | null;
  training_days: number | null;
  weighted_days: number | null;
  value_pln: number | null;
};

function toNumber(value: number | null) {
  return value ?? 0;
}

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { supabase, userId } = auth;

  const { data, error } = await supabase
    .from("prospecting_opportunities")
    .select("stage, training_days, weighted_days, value_pln")
    .eq("assigned_to", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as OpportunityRow[];

  const byStage = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.stage ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const totals = rows.reduce(
    (acc, row) => {
      acc.training_days += toNumber(row.training_days);
      acc.weighted_days += toNumber(row.weighted_days);
      acc.value_pln += toNumber(row.value_pln);
      return acc;
    },
    { training_days: 0, weighted_days: 0, value_pln: 0 }
  );

  return NextResponse.json({
    kpis: {
      opportunities_total: rows.length,
      training_days_total: totals.training_days,
      weighted_days_total: totals.weighted_days,
      pipeline_value_pln_total: totals.value_pln,
      by_stage: byStage,
    },
  });
}