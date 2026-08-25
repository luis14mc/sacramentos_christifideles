'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import PersonaSelector from '@/components/bautismos/PersonaSelector';
import MinistroSelector from '@/components/sacramentos/MinistroSelector';
import NumeracionAutomaticaControl from '@/components/sacramentos/NumeracionAutomaticaControl';

interface FormState {
  numero_identidad_persona: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
  fecha_primera_comunion: string;
  numero_acta: string;
  numero_libro: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal: string;
}

const empty: FormState = {
  numero_identidad_persona: '',
  numero_identidad_madre: '',
  numero_identidad_padre: '',
  numero_identidad_catequista: '',
  numero_identidad_sacerdote: '',
  fecha_primera_comunion: '',
  numero_acta: '',
  numero_libro: '',
  numero_pagina: '',
  numero_registro: '',
  nota_marginal: '',
};

const PARTICIPANTES: [keyof FormState, string][] = [
  ['numero_identidad_persona', 'Comulgante'],
  ['numero_identidad_madre', 'Madre'],
  ['numero_identidad_padre', 'Padre'],
  ['numero_identidad_catequista', 'Catequista'],
];

const REGISTRALES: [keyof FormState, string][] = [
  ['numero_acta', 'Acta'],
  ['numero_libro', 'Libro'],
  ['numero_pagina', 'Página'],
  ['numero_registro', 'Registro'],
];

export default function ComunionForm({ registroId }: { registroId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [numeracionAutomatica, setNumeracionAutomatica] = useState(false);
  const isEdit = Boolean(registroId);

  useEffect(() => {
    if (!registroId) return;
    fetch(`/api/primeras-comuniones/${registroId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (!b) return;
        setForm({
          numero_identidad_persona: b.numero_identidad_persona ?? '',
          numero_identidad_madre: b.numero_identidad_madre ?? '',
          numero_identidad_padre: b.numero_identidad_padre ?? '',
          numero_identidad_catequista: b.numero_identidad_catequista ?? '',
          numero_identidad_sacerdote: b.numero_identidad_sacerdote ?? '',
          fecha_primera_comunion: b.fecha_primera_comunion ? String(b.fecha_primera_comunion).slice(0, 10) : '',
          numero_acta: b.numero_acta ?? '',
          numero_libro: b.numero_libro ?? '',
          numero_pagina: b.numero_pagina ?? '',
          numero_registro: b.numero_registro ?? '',
          nota_marginal: b.nota_marginal ?? '',
        });
      });
  }, [registroId]);

  const setField = (f: keyof FormState, v: string) => setForm((prev) => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/primeras-comuniones/${registroId}` : '/api/primeras-comuniones';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(isEdit ? form : { ...form, numeracion_automatica: numeracionAutomatica }),
      });
      const data = await res.json();
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: data.error || 'Error' });
        return;
      }
      await Swal.fire({ icon: 'success', title: 'Guardado', timer: 1200, showConfirmButton: false });
      router.push(`/primeras-comuniones/${isEdit ? registroId : data.id_primera_comunion}`);
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error de red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Participantes (Personas registradas)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PARTICIPANTES.map(([field, label]) => (
            <PersonaSelector key={field} label={label} required value={form[field]} onChange={(v) => setField(field, v)} />
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Ministro y datos registrales</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MinistroSelector label="Sacerdote" required value={form.numero_identidad_sacerdote} onChange={(v) => setField('numero_identidad_sacerdote', v)} />
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Fecha de Primera Comunión <span className="text-error">*</span></span>
            </label>
            <input type="date" className="input input-bordered w-full" value={form.fecha_primera_comunion} onChange={(e) => setField('fecha_primera_comunion', e.target.value)} required />
          </div>
          {!isEdit && (
            <NumeracionAutomaticaControl
              modulo="primera_comunion"
              enabled={numeracionAutomatica}
              onEnabledChange={setNumeracionAutomatica}
              onSuggestion={(s) => setForm((prev) => ({ ...prev, numero_libro: s.numero_libro, numero_registro: s.numero_registro }))}
            />
          )}
          {REGISTRALES.map(([field, label]) => (
            <div className="form-control" key={field}>
              <label className="label">
                <span className="label-text font-medium">{label} <span className="text-error">*</span></span>
              </label>
              <input type="text" className="input input-bordered w-full" value={form[field]} onChange={(e) => setField(field, e.target.value)} required />
            </div>
          ))}
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-medium">Nota marginal</span>
            </label>
            <textarea className="textarea textarea-bordered w-full" value={form.nota_marginal} onChange={(e) => setField('nota_marginal', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar primera comunión'}
        </button>
      </div>
    </form>
  );
}
