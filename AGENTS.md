# AGENTS — TC-ERP (este workspace)

## Alcance

- Aplicación **Next.js 16** (App Router) + **Supabase**; SQL versionado bajo `supabase/`.
- No ejecutar reset/checkout destructivos ni sobrescribir trabajo local ajeno.
- No editar migraciones ya aplicadas en entornos compartidos: añadir solo migraciones **nuevas** con número mayor.

## Reglas de negocio y observabilidad

- **Auditoría operativa** (p. ej. filas en `erp_audit_logs`, acciones de negocio): debe conservarse; no silenciar errores con `catch` vacío ni devolver éxito falso.
- **Logs técnicos** (peticiones HTTP, duración, tamaño): un único registro estructurado por solicitud entrante; evitar duplicar el mismo evento entre utilidades.
- **Egreso HTTP** (llamadas salientes): log separado del de la petición entrante, sin reutilizar el mismo helper que la API route si eso duplica líneas.

## Fases de trabajo (referencia)

- Fase 0: confirmar rama/commit y políticas del repo antes de cambiar código.
- Fase 1: funciones Postgres expuestas a PostgREST (`emit_domain_event`, etc.): una firma canónica o nombres distintos para evitar ambigüedad.
- Fase 2: consolidar logging HTTP en `src/shared/infrastructure/http/`.
