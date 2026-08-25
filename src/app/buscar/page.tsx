'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { PageCard, PageHeader } from '@/components/layout/PageHeader';
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
        <PageHeader
          icon={<MagnifyingGlassIcon className="h-6 w-6 text-primary" />}
          title="Búsqueda global"
          subtitle="Buscar personas y sacramentos por DNI, nombre, libro o registro"
        />

        <PageCard>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                className="input input-bordered w-full pl-10"
                placeholder="DNI, nombre, apellido, libro o registro…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscar()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={buscar}>Buscar</button>
          </div>
        </PageCard>

        {loading && <PageCard><p className="text-base-content/60">Buscando…</p></PageCard>}
        {buscado && !loading && res && res.total === 0 && (
          <PageCard><p className="text-base-content/60">Sin resultados.</p></PageCard>
        )}

        {res && res.total > 0 && (
          <div className="space-y-6">
            {GRUPOS.map(([key, label]) => {
              const items = res[key] as Resultado[];
              if (!items.length) return null;
              return (
                <PageCard key={key} padding={false} className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-base-300">
                    <h2 className="font-semibold">{label} <span className="text-base-content/50">({items.length})</span></h2>
                  </div>
                  <div className="divide-y divide-base-300">
                    {items.map((r) => (
                      <Link key={`${r.tipo}-${r.id}`} href={r.href} className="flex items-center justify-between px-6 py-3 hover:bg-base-200">
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
                </PageCard>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
