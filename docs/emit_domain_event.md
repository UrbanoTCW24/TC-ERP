# `emit_domain_event` — ambigüedad PostgREST

## Síntoma

PostgreSQL / PostgREST: **Could not choose the best candidate function** entre dos variantes de `emit_domain_event` que solo difieren en el tipo de `p_correlation_id` (`text` vs `uuid`).

PostgREST resuelve la RPC por nombre y tipos; dos funciones sobrecargadas con el mismo nombre y parámetros compatibles para el cliente pueden volverse **ambigüas** cuando el JSON no fuerza un tipo concreto.

## Comprobaciones (solo lectura) en Supabase SQL

```sql
-- Firmas registradas
SELECT p.oid::regprocedure AS signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'emit_domain_event' AND n.nspname = 'public';

-- Cuerpo (una firma a la vez)
SELECT pg_get_functiondef('public.emit_domain_event(text, uuid, jsonb, uuid)'::regprocedure);
```

## Corrección compatible

1. Añadir migración **nueva** (no reescribir las ya aplicadas): ver `supabase/020_emit_domain_event.sql`.
2. Política de tipos: **`p_correlation_id uuid`** como única variante pública.
3. Eliminar la sobrecarga con `text` **solo después** de verificar que ningún consumidor depende de ella:

```sql
-- Tras revisar llamadas en app y otras funciones SQL
DROP FUNCTION IF EXISTS public.emit_domain_event(text, uuid, jsonb, text);
```

## Cliente TypeScript / Supabase

Al invocar `supabase.rpc('emit_domain_event', { ... })`, pasar `p_correlation_id` como **UUID válido** (string con formato UUID) o `null` para omitir.

Resolver en la capa de aplicación no sustituye la necesidad de **una sola firma resoluble** en el catálogo de Postgres.

## Prueba significativa

1. Tras aplicar la migración en un entorno de prueba, ejecutar el flujo **classify-equipment-batch** (o la RPC que emite el evento).
2. Verificar **una fila** insertada por transacción esperada en `domain_events` (o la tabla de eventos definitiva del proyecto) con `correlation_id` coherente.
3. Confirmar en logs que no hay error de resolución de función.
