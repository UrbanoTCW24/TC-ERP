import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withApiHandler } from "@/shared/infrastructure/http/apiHandler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withApiHandler("/api/audit", req, async ({ correlationId }) => {
    const body = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error(
        JSON.stringify({
          msg: "audit.config_missing",
          ts: new Date().toISOString(),
          kind: "business_audit",
          correlationId,
        })
      );
      return NextResponse.json(
        { error: "Server configuration incomplete" },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase.from("erp_audit_logs").insert({
      user_id: body.user_id || null,
      user_role: body.user_role || "Desconocido",
      branch_id: body.branch_id || null,
      module: body.module,
      table_name: body.table_name,
      record_id: body.record_id,
      action: body.action,
      severity: body.severity || "INFO",
      old_values: body.old_values || null,
      new_values: body.new_values || null,
      user_agent: body.user_agent || null,
      observations: body.observations || null,
    });

    if (error) {
      console.error(
        JSON.stringify({
          msg: "audit.insert_failed",
          ts: new Date().toISOString(),
          kind: "business_audit",
          correlationId,
          error: error.message,
        })
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  });
}
