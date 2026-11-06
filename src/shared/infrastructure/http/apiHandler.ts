import { NextRequest, NextResponse } from "next/server";
import { logApiRequest } from "@/shared/infrastructure/http/structuredLog";

export interface ApiHandlerContext {
  correlationId: string;
}

function parseContentLength(header: string | null): number | undefined {
  if (!header) return undefined;
  const n = parseInt(header, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Envuelve un Route Handler: un solo log técnico por petición completada.
 * Propaga x-correlation-id en la respuesta (genera UUID si no viene en la petición).
 * El handler debe lanzar Error en fallos de negocio para que el mensaje quede en el log estructurado.
 */
export async function withApiHandler(
  route: string,
  req: NextRequest,
  handler: (ctx: ApiHandlerContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const start = Date.now();
  const requestBytes = parseContentLength(req.headers.get("content-length"));

  try {
    const res = await handler({ correlationId });
    const durationMs = Date.now() - start;
    const responseBytes = parseContentLength(res.headers.get("content-length"));

    logApiRequest({
      route,
      method: req.method,
      correlationId,
      status: res.status,
      durationMs,
      requestBytes,
      responseBytes,
    });

    const headers = new Headers(res.headers);
    headers.set("x-correlation-id", correlationId);

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);

    logApiRequest({
      route,
      method: req.method,
      correlationId,
      status: 500,
      durationMs,
      requestBytes,
      errorMessage,
    });

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: { "x-correlation-id": correlationId },
      }
    );
  }
}
