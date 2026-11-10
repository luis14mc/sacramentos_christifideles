# Privacidad y tratamiento de datos

**Versión:** 1 · 2026-11-10 · **Responsable del tratamiento:** cada parroquia sobre sus propios libros. **Operador técnico:** el equipo de ChristiFideles.

> Documento operativo, no es asesoría legal. Antes de ampliar a más parroquias conviene revisarlo con la diócesis y con asesoría legal sobre la normativa hondureña vigente.

## 1. Qué datos se guardan
| Categoría | Ejemplos | Dónde |
|---|---|---|
| Identidad de personas | DNI, nombres, apellidos, sexo, fecha y lugar de nacimiento | Base de la parroquia |
| Contacto | Teléfono, dirección, email (opcionales) | Base de la parroquia |
| Datos sacramentales | Fecha, libro, página, registro, folio, ministro, padres, padrinos, testigos, cónyuge | Base de la parroquia |
| Usuarios del sistema | Nombre, email, rol, contraseña (solo como hash bcrypt) | Base de la parroquia |
| Auditoría | Quién cambió qué, cuándo y por qué | Base de la parroquia |
| Configuración | Logo, moldes PDF, nombre del párroco | Base de la parroquia |
| Consultas entre parroquias | Código de parroquia, huella irreversible del DNI, estado, fechas | Base del centralizador (sin nombres ni sacramentos) |

Los datos sacramentales son información religiosa: se tratan como **sensibles**.

## 2. Quién los ve
- Solo los usuarios de **la propia parroquia**, según su rol (ver [manual §2](MANUAL_USUARIO.md)).
- **Otra parroquia** solo recibe datos cuando el párroco aprueba una consulta, y solo: nombres, apellidos, fecha de nacimiento y, por sacramento, tipo, fecha, libro, página, registro y folio ([ADR-004](adr/ADR-004-consultas-solo-lectura.md)).
- **El centralizador** no guarda datos personales ni sacramentales; reenvía y deja bitácora con la huella del DNI.
- **El equipo técnico** (admin general) tiene acceso para soporte. Todo acceso queda en la auditoría.

## 3. Seguridad aplicada
- Una base de datos por parroquia (aislamiento físico).
- HTTPS en todos los servicios; contraseñas con bcrypt; bloqueo tras 5 intentos fallidos.
- Mensajes entre parroquias firmados (HMAC-SHA256) con caducidad de 5 minutos; llaves cifradas en el hub.
- Edición con justificación obligatoria y auditoría.
- Respaldos cifrados con age; la llave privada se guarda fuera de Railway y de GitHub.

## 4. Conservación
| Dato | Plazo |
|---|---|
| Registros sacramentales | Permanente (son libros parroquiales) |
| Auditoría | Permanente mientras exista el registro |
| Respaldos en R2 | 30 días (rotación automática) |
| Bitácora del centralizador | Por definir (propuesta: 2 años) |
| Usuarios dados de baja | Se desactivan, no se borran, para conservar la auditoría |

## 5. Derechos de las personas
Una persona puede pedir a **su parroquia** ver o corregir sus datos. La corrección se hace en el sistema con justificación. Los registros sacramentales no se eliminan (son actas), pero sí se corrigen los datos erróneos y se pueden borrar los datos de contacto opcionales.

## 6. Incidentes de seguridad
Ante una sospecha de acceso indebido o pérdida de datos: seguir [RUNBOOK_INCIDENTES.md §4](RUNBOOK_INCIDENTES.md), avisar al PO el mismo día y a la parroquia afectada en menos de 72 horas, con lo que se sabe.

## 7. Reglas para el equipo
- Nunca copiar datos reales a entornos de desarrollo, a issues, a capturas ni a chats con IA.
- Pruebas solo con datos ficticios (DNI de prueba, apellido `PRUEBA`).
- No descargar respaldos descifrados fuera de una restauración de prueba; borrarlos al terminar.
