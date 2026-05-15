import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase } = auth;

    const { data: orgIdData, error: orgError } = await supabase.rpc("current_org_id");
    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 });
    }

    const orgId = typeof orgIdData === "string" ? orgIdData : null;
    if (!orgId) {
      return NextResponse.json({ error: "Missing org_id for current session." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("prospecting_accounts")
      .select("id, name, industry, company_size, segment, website, phone, email, created_at")
      .eq("org_id", orgId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase, userId } = auth;
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const { data: orgIdData, error: orgError } = await supabase.rpc("current_org_id");
    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 });
    }

    const orgId = typeof orgIdData === "string" ? orgIdData : null;
    if (!orgId) {
      return NextResponse.json({ error: "Missing org_id for current session." }, { status: 400 });
    }

    const payload = {
      org_id: orgId,
      name,
      industry: body.industry ?? null,
      company_size: body.company_size ?? null,
      segment: body.segment ?? null,
      website: body.website ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      notes: body.notes ?? null,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from("prospecting_accounts")
      .insert(payload)
      .select("id, org_id, name, industry, created_at")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    const { data: orgIdData, error: orgError } = await supabase.rpc("current_org_id");
    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 });
    }

    const orgId = typeof orgIdData === "string" ? orgIdData : null;
    if (!orgId) {
      return NextResponse.json({ error: "Missing org_id for current session." }, { status: 400 });
    }

    const { error } = await supabase
      .from("prospecting_accounts")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    const { data: orgIdData, error: orgError } = await supabase.rpc("current_org_id");
    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 });
    }

    const orgId = typeof orgIdData === "string" ? orgIdData : null;
    if (!orgId) {
      return NextResponse.json({ error: "Missing org_id for current session." }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, string | null> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Field name cannot be empty" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.industry !== undefined) {
      updates.industry = typeof body.industry === "string" && body.industry.trim() ? body.industry.trim() : null;
    }

    if (body.website !== undefined) {
      updates.website = typeof body.website === "string" && body.website.trim() ? body.website.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("prospecting_accounts")
      .update(updates)
      .eq("id", id)
      .eq("org_id", orgId)
      .select("id, name, industry, website")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
