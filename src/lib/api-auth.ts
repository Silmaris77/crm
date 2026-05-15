import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "./supabase";

type AuthOk = {
  ok: true;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  userId: string;
};

type AuthFail = {
  ok: false;
  response: NextResponse;
};

export async function requireApiSession(): Promise<AuthOk | AuthFail> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Unauthorized. Missing or invalid Supabase session." },
          { status: 401 }
        ),
      };
    }

    return { ok: true, supabase, userId: user.id };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unable to validate user session." },
        { status: 500 }
      ),
    };
  }
}