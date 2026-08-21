'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Resultado {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo: string;
  dni: string | null;
  fecha: string | null;
  libro: string | null;
  registro: string | null;
  href: string;
}
interface Agrupada {
  personas: Resultado[];
  bautismos: Resultado[];
  primeras_comuniones: Resultado[];
  confirmaciones: Resultado[];
  matrimonios: Resultado[];
  total: number;
}

const GRUPOS: [keyof Agrupada, string][] = [
  ['personas', 'Personas'],
  ['bautismos', 'Bautismos'],
  ['primeras_comuniones', 'Primeras Comuniones'],
  ['confirmaciones', 'Confirmaciones'],
  ['matrimonios', 'Matrimonios'],
];

export default function BuscarPage() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Agrupada | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = async () => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setBuscado(true);
    try {
      const r = await fetch(`/api/busqueda?q=${encodeURIComponent(q.trim())}`);
      setRes(r.ok ? await r.json() : null);
    } catch {
      setRes(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Búsqueda global</h1>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-base-300 px-3 py-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-base-content/50" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="DNI, nombre, apellido, libro o registro…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              autoFocus
            />
          </div>
          <button className="btn btn-primary" onClick={buscar}>Buscar</button>
        </div>

        {loading && <p className="text-base-content/60">Buscando…</p>}
        {buscado && !loading && res && res.total === 0 && <p className="text-base-content/60">Sin resultados.</p>}

        {res && res.total > 0 && (
          <div className="space-y-6">
            {GRUPOS.map(([key, label]) => {
              const items = res[key] as Resultado[];
              if (!items.length) return null;
              return (
                <div key={key}>
                  <h2 className="mb-2 font-semibold">{label} <span className="text-base-content/50">({items.length})</span></h2>
                  <div className="divide-y divide-base-300 rounded-lg border border-base-300">
                    {items.map((r) => (
                      <Link key={`${r.tipo}-${r.id}`} href={r.href} className="flex items-center justify-between px-4 py-2 hover:bg-base-200">
                        <div>
                          <div className="font-medium">{r.titulo}</div>
                          <div className="text-sm text-base-content/60">
                            {r.dni ? `DNI ${r.dni}` : ''}
                            {r.libro ? ` · Libro ${r.libro} · Registro ${r.registro}` : ''}
                            {r.fecha ? ` · ${String(r.fecha).slice(0, 10)}` : ''}
                          </div>
                        </div>
                        <span className="badge badge-ghost">{r.subtitulo}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
