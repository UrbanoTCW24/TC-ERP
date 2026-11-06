import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/shared/infrastructure/http/apiHandler";

export const dynamic = "force-dynamic";

/**
 * Endpoint workshop tasks (stub). La lógica de paginación / dataset vive en ramas con más módulos.
 * Aquí solo aseguramos un único log técnico por petición entrante.
 */
export async function GET(req: NextRequest) {
  return withApiHandler("/api/v1/workshop/tasks", req, async () => {
    return NextResponse.json({ data: [], page: 1, pageSize: 0 });
  });
}
