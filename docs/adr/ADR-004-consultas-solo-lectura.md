# ADR-004 — Consultas entre parroquias: solo lectura y con aprobación humana

- **Estado:** Aceptada · **Fecha:** 2026-09-24 · **Decide:** PO

## Contexto
Una parroquia necesita verificar sacramentos recibidos en otra (por ejemplo, el bautismo para un matrimonio) sin acceso a su base.

## Decisión
- La parroquia de origen envía DNI + motivo a través del hub.
- La parroquia consultada **decide una persona** (rol con `canResolverInterop`, hoy el párroco): aprueba o rechaza con motivo.
- Al aprobar se comparten **solo**: nombres, apellidos, fecha de nacimiento y, por sacramento, tipo, fecha, libro, página, registro y folio. Nunca teléfono, email, dirección ni datos de padres o padrinos.
- Nada se escribe en la base de la otra parroquia.
- El hub guarda el DNI solo como huella irreversible y no guarda datos sacramentales.

## Consecuencias
- ✅ Cada parroquia mantiene el control de sus libros.
- ⚠️ La respuesta depende de que alguien atienda la bandeja (contador de pendientes en el menú).
- Abierto: flujo tipo chat con constancia emitida por la parroquia del libro (en evaluación por el PO).
