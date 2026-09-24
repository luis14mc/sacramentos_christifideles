/**
 * Límite de intentos de login fallidos (anti fuerza bruta).
 *
 * En memoria: cada parroquia corre en una sola instancia (docs/PLAN_MULTIPARROQUIA.md),
 * así que no hace falta un almacén compartido. Un reinicio limpia los contadores.
 */

export const MAX_INTENTOS = 5;
export const VENTANA_MS = 15 * 60 * 1000;

interface Registro {
  fallos: number[];
  bloqueadoHasta: number;
}

export class LimitadorLogin {
  private registros = new Map<string, Registro>();

  constructor(
    private readonly maxIntentos = MAX_INTENTOS,
    private readonly ventanaMs = VENTANA_MS
  ) {}

  private clave(email: string): string {
    return email.trim().toLowerCase();
  }

  estaBloqueado(email: string, ahora = Date.now()): boolean {
    const r = this.registros.get(this.clave(email));
    return !!r && r.bloqueadoHasta > ahora;
  }

  registrarFallo(email: string, ahora = Date.now()): void {
    const k = this.clave(email);
    const r = this.registros.get(k) ?? { fallos: [], bloqueadoHasta: 0 };
    r.fallos = r.fallos.filter((t) => ahora - t < this.ventanaMs);
    r.fallos.push(ahora);
    if (r.fallos.length >= this.maxIntentos) {
      r.bloqueadoHasta = ahora + this.ventanaMs;
      r.fallos = [];
    }
    this.registros.set(k, r);
    if (this.registros.size > 10_000) this.purgar(ahora);
  }

  registrarExito(email: string): void {
    this.registros.delete(this.clave(email));
  }

  private purgar(ahora: number): void {
    for (const [k, r] of this.registros) {
      if (r.bloqueadoHasta <= ahora && r.fallos.every((t) => ahora - t >= this.ventanaMs)) {
        this.registros.delete(k);
      }
    }
  }
}

export const limitadorLogin = new LimitadorLogin();
