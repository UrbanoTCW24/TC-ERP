/**
 * Logs técnicos estructurados (peticiones HTTP entrantes, duración, tamaño).
 * No sustituye auditoría de negocio (tablas erp_audit_logs, domain_events, etc.).
 */

export type TechnicalLogLevel = "info" | "warn" | "error";

export interface ApiRequestLogPayload {
  /** Ruta lógica (ej. /api/audit), no URL completa con querystring salvo necesidad */
  route: string;
  method: string;
  correlationId: string;
  status: number;
  durationMs: number;
  requestBytes?: number;
  responseBytes?: number;
  errorMessage?: string;
}

function emit(level: TechnicalLogLevel, message: string, payload: Record<string, unknown>): void {
  const line = JSON.stringify({ msg: message, ts: new Date().toISOString(), ...payload });
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

/**
 * Un único registro por solicitud HTTP atendida por una API route.
 */
export function logApiRequest(payload: ApiRequestLogPayload): void {
  const level: TechnicalLogLevel =
    payload.status >= 500 ? "error" : payload.status >= 400 ? "warn" : "info";

  emit(level, "api.request", {
    kind: "http_inbound",
    route: payload.route,
    method: payload.method,
    correlationId: payload.correlationId,
    status: payload.status,
    durationMs: payload.durationMs,
    requestBytes: payload.requestBytes ?? null,
    responseBytes: payload.responseBytes ?? null,
    errorMessage: payload.errorMessage ?? null,
  });
}
