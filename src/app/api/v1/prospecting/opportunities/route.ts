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

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase, userId } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("prospecting_opportunities")
      .delete()
      .eq("id", id)
      .eq("assigned_to", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase, userId } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, string | number | null> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        return NextResponse.json({ error: "Field title cannot be empty" }, { status: 400 });
      }
      updates.title = title;
    }

    if (body.stage !== undefined) {
      const stage = typeof body.stage === "string" ? body.stage.trim() : "";
      if (!stage) {
        return NextResponse.json({ error: "Field stage cannot be empty" }, { status: 400 });
      }
      updates.stage = stage;
    }

    if (body.training_days !== undefined) {
      const trainingDays = Number(body.training_days);
      if (!Number.isFinite(trainingDays) || trainingDays <= 0) {
        return NextResponse.json({ error: "Field training_days must be > 0" }, { status: 400 });
      }
      updates.training_days = trainingDays;
    }

    if (body.probability !== undefined) {
      const probability = Number(body.probability);
      if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
        return NextResponse.json({ error: "Field probability must be between 0 and 100" }, { status: 400 });
      }
      updates.probability = probability;
    }

    if (body.value_pln !== undefined) {
      if (body.value_pln === null || body.value_pln === "") {
        updates.value_pln = null;
      } else {
        const valuePln = Number(body.value_pln);
        if (!Number.isFinite(valuePln) || valuePln < 0) {
          return NextResponse.json({ error: "Field value_pln must be >= 0" }, { status: 400 });
        }
        updates.value_pln = valuePln;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("prospecting_opportunities")
      .update(updates)
      .eq("id", id)
      .eq("assigned_to", userId)
      .select("id, title, stage, training_days, probability, value_pln, weighted_days")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
