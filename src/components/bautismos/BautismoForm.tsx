'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import PersonaSelector from './PersonaSelector';
import NumeracionAutomaticaControl from '@/components/sacramentos/NumeracionAutomaticaControl';

interface SacerdoteLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  rango?: { nombre: string } | null;
}

interface FormState {
  numero_identidad_bautizado: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
  fecha_bautismo: string;
  numero_libro: string;
  numero_folio: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal: string;
}

const emptyForm: FormState = {
  numero_identidad_bautizado: '',
  numero_identidad_madre: '',
  numero_identidad_padre: '',
  numero_identidad_madrina: '',
  numero_identidad_padrino: '',
  numero_identidad_catequista: '',
  numero_identidad_sacerdote: '',
  fecha_bautismo: '',
  numero_libro: '',
  numero_folio: '',
  numero_pagina: '',
  numero_registro: '',
  nota_marginal: '',
};

const PARTICIPANTES: [keyof FormState, string][] = [
  ['numero_identidad_bautizado', 'Bautizado'],
  ['numero_identidad_madre', 'Madre'],
  ['numero_identidad_padre', 'Padre'],
  ['numero_identidad_madrina', 'Madrina'],
  ['numero_identidad_padrino', 'Padrino'],
  ['numero_identidad_catequista', 'Catequista'],
];

export default function BautismoForm({ bautismoId }: { bautismoId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sacerdotes, setSacerdotes] = useState<SacerdoteLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [numeracionAutomatica, setNumeracionAutomatica] = useState(false);
  const isEdit = Boolean(bautismoId);

  useEffect(() => {
    fetch('/api/sacerdotes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSacerdotes(Array.isArray(d) ? d : []))
      .catch(() => setSacerdotes([]));
  }, []);

  useEffect(() => {
    if (!bautismoId) return;
    fetch(`/api/bautismos/${bautismoId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (!b) return;
        setForm({
          numero_identidad_bautizado: b.numero_identidad_bautizado ?? '',
          numero_identidad_madre: b.numero_identidad_madre ?? '',
          numero_identidad_padre: b.numero_identidad_padre ?? '',
          numero_identidad_madrina: b.numero_identidad_madrina ?? '',
          numero_identidad_padrino: b.numero_identidad_padrino ?? '',
          numero_identidad_catequista: b.numero_identidad_catequista ?? '',
          numero_identidad_sacerdote: b.numero_identidad_sacerdote ?? '',
          fecha_bautismo: b.fecha_bautismo ? String(b.fecha_bautismo).slice(0, 10) : '',
          numero_libro: b.numero_libro ?? '',
          numero_folio: b.numero_folio ?? '',
          numero_pagina: b.numero_pagina ?? '',
          numero_registro: b.numero_registro ?? '',
          nota_marginal: b.nota_marginal ?? '',
        });
      });
  }, [bautismoId]);

  const setField = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/bautismos/${bautismoId}` : '/api/bautismos';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(isEdit ? form : { ...form, numeracion_automatica: numeracionAutomatica }),
      });
      const data = await res.json();
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: data.error || 'Error' });
        return;
      }
      await Swal.fire({ icon: 'success', title: 'Guardado', timer: 1200, showConfirmButton: false });
      const id = isEdit ? bautismoId : data.id_bautismo;
      router.push(`/bautismos/${id}`);
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error de red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-base-300 p-4">
        <h3 className="mb-3 font-semibold">Participantes (Personas registradas)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PARTICIPANTES.map(([field, label]) => (
            <PersonaSelector
              key={field}
              label={label}
              required
              value={form[field]}
              onChange={(v) => setField(field, v)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-base-300 p-4">
        <h3 className="mb-3 font-semibold">Ministro y datos registrales</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Sacerdote <span className="text-error">*</span></span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.numero_identidad_sacerdote}
              onChange={(e) => setField('numero_identidad_sacerdote', e.target.value)}
              required
            >
              <option value="">Seleccionar sacerdote…</option>
              {sacerdotes.map((s) => (
                <option key={s.numero_identidad} value={s.numero_identidad}>
                  {s.nombres} {s.apellidos}
                  {s.rango?.nombre ? ` (${s.rango.nombre})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Fecha de Bautismo <span className="text-error">*</span></span>
            </label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={form.fecha_bautismo}
              onChange={(e) => setField('fecha_bautismo', e.target.value)}
              required
            />
          </div>

          {!isEdit && (
            <NumeracionAutomaticaControl
              modulo="bautismo"
              enabled={numeracionAutomatica}
              onEnabledChange={setNumeracionAutomatica}
              onSuggestion={(s) => setForm((prev) => ({ ...prev, numero_libro: s.numero_libro, numero_registro: s.numero_registro }))}
            />
          )}

          {([
            ['numero_libro', 'Libro'],
            ['numero_folio', 'Folio'],
            ['numero_pagina', 'Página'],
            ['numero_registro', 'Registro'],
          ] as [keyof FormState, string][]).map(([field, label]) => (
            <div className="form-control" key={field}>
              <label className="label">
                <span className="label-text font-medium">{label} <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form[field]}
                onChange={(e) => setField(field, e.target.value)}
                required
              />
            </div>
          ))}

          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-medium">Nota marginal</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              value={form.nota_marginal}
              onChange={(e) => setField('nota_marginal', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar bautismo'}
        </button>
      </div>
    </form>
  );
}
