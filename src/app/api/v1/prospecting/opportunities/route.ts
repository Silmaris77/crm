import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase, userId } = auth;
    const { searchParams } = new URL(req.url);

    const stage = searchParams.get("stage");
    const limit = Number(searchParams.get("limit") ?? "50");

    let query = supabase
      .from("prospecting_opportunities")
      .select("id, account_id, contact_id, title, project_type, training_days, stage, probability, value_pln, weighted_days, expected_close_date, assigned_to, created_at")
      .order("created_at", { ascending: false })
      .limit(Number.isNaN(limit) ? 50 : Math.min(limit, 200));

    if (stage) query = query.eq("stage", stage);
    query = query.eq("assigned_to", userId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase, userId } = auth;
    const body = await req.json();

    const requiredFields = ["org_id", "account_id", "title", "project_type", "training_days"];
    const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const payload = {
      org_id: body.org_id,
      account_id: body.account_id,
      contact_id: body.contact_id ?? null,
      title: body.title,
      project_type: body.project_type,
      training_days: body.training_days,
      stage: body.stage ?? "target",
      probability: body.probability ?? 50,
      value_pln: body.value_pln ?? null,
      expected_close_date: body.expected_close_date ?? null,
      assigned_to: body.assigned_to ?? userId,
      problem_trigger: body.problem_trigger ?? null,
      next_step: body.next_step ?? null,
      notes: body.notes ?? null,
      created_by: body.created_by ?? userId,
    };

    const { data, error } = await supabase
      .from("prospecting_opportunities")
      .insert(payload)
      .select("id, title, stage, training_days, probability, weighted_days, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
