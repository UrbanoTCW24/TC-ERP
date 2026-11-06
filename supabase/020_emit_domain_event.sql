-- emit_domain_event — firma única para PostgREST
-- Producción: ambigüedad entre (..., p_correlation_id text) y (..., p_correlation_id uuid).
-- Aplicar en un entorno nuevo o como migración incremental; no editar migraciones ya aplicadas en otros entornos.

CREATE TABLE IF NOT EXISTS public.domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  aggregate_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS domain_events_aggregate_id_idx
  ON public.domain_events (aggregate_id);
CREATE INDEX IF NOT EXISTS domain_events_correlation_id_idx
  ON public.domain_events (correlation_id);
CREATE INDEX IF NOT EXISTS domain_events_created_at_idx
  ON public.domain_events (created_at DESC);

-- Quitar sobrecarga con correlation_id text (ajustar lista de argumentos si en DB difiere)
DROP FUNCTION IF EXISTS public.emit_domain_event(text, uuid, jsonb, text);

CREATE OR REPLACE FUNCTION public.emit_domain_event(
  p_event_type text,
  p_aggregate_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_correlation_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.domain_events (
    event_type,
    aggregate_id,
    payload,
    correlation_id
  )
  VALUES (
    p_event_type,
    p_aggregate_id,
    coalesce(p_payload, '{}'::jsonb),
    p_correlation_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.emit_domain_event(text, uuid, jsonb, uuid) IS
  'Emite un evento de dominio. p_correlation_id es uuid para resolver ambigüedad en PostgREST.';

GRANT EXECUTE ON FUNCTION public.emit_domain_event(text, uuid, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.emit_domain_event(text, uuid, jsonb, uuid) TO service_role;

-- Ajustar visibilidad de la tabla según políticas del proyecto (RLS, grants a roles).
