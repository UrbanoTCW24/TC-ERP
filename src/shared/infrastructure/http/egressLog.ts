export interface EgressLogPayload {
  correlationId: string;
  method: string;
  /** URL absoluta o relativa del egreso */
  url: string;
  status?: number;
  durationMs: number;
  requestBytes?: number;
  responseBytes?: number;
  errorMessage?: string;
}

/**
 * Registro de llamadas HTTP salientes (p. ej. Supabase desde servidor).
 * No debe llamar a logApiRequest: el registro inbound es responsabilidad de withApiHandler en la ruta API.
 */
export function logEgress(payload: EgressLogPayload): void {
  console.info(
    JSON.stringify({
      msg: "http.egress",
      ts: new Date().toISOString(),
      kind: "http_outbound",
      correlationId: payload.correlationId,
      method: payload.method,
      url: payload.url,
      status: payload.status ?? null,
      durationMs: payload.durationMs,
      requestBytes: payload.requestBytes ?? null,
      responseBytes: payload.responseBytes ?? null,
      errorMessage: payload.errorMessage ?? null,
    })
  );
}
