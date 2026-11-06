import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withApiHandler } from "@/shared/infrastructure/http/apiHandler";

export async function POST(request: NextRequest) {
  return withApiHandler("/api/auth/session", request, async ({ correlationId }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        JSON.stringify({
          msg: "session.config_missing",
          ts: new Date().toISOString(),
          kind: "auth",
          correlationId,
        })
      );
      return NextResponse.json(
        { error: "Server configuration incomplete" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    await supabase.from("user_sessions").delete().eq("user_id", userId);

    const { data, error } = await supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        ip_address: ip,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        JSON.stringify({
          msg: "session.create_failed",
          ts: new Date().toISOString(),
          kind: "auth",
          correlationId,
          error: error.message,
        })
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sessionId: data.id });
  });
}
