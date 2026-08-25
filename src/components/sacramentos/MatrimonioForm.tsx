'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import PersonaSelector from '@/components/bautismos/PersonaSelector';
import MinistroSelector from '@/components/sacramentos/MinistroSelector';
import NumeracionAutomaticaControl from '@/components/sacramentos/NumeracionAutomaticaControl';

interface FormState {
  numero_identidad_esposa: string;
  numero_identidad_esposo: string;
  numero_identidad_madre_esposa: string;
  numero_identidad_padre_esposa: string;
  numero_identidad_madre_esposo: string;
  numero_identidad_padre_esposo: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_sacerdote: string;
  fecha_matrimonio: string;
  numero_acta: string;
  numero_libro: string;
  numero_pagina: string;
  numero_registro: string;
  nota_marginal: string;
}

const empty: FormState = {
  numero_identidad_esposa: '', numero_identidad_esposo: '',
  numero_identidad_madre_esposa: '', numero_identidad_padre_esposa: '',
  numero_identidad_madre_esposo: '', numero_identidad_padre_esposo: '',
  numero_identidad_madrina: '', numero_identidad_padrino: '',
  numero_identidad_sacerdote: '', fecha_matrimonio: '',
  numero_acta: '', numero_libro: '', numero_pagina: '', numero_registro: '', nota_marginal: '',
};

const OBLIGATORIOS: [keyof FormState, string][] = [
  ['numero_identidad_esposa', 'Esposa'],
  ['numero_identidad_esposo', 'Esposo'],
  ['numero_identidad_madrina', 'Madrina'],
  ['numero_identidad_padrino', 'Padrino'],
];
const OPCIONALES: [keyof FormState, string][] = [
  ['numero_identidad_madre_esposa', 'Madre de la esposa (opcional)'],
  ['numero_identidad_padre_esposa', 'Padre de la esposa (opcional)'],
  ['numero_identidad_madre_esposo', 'Madre del esposo (opcional)'],
  ['numero_identidad_padre_esposo', 'Padre del esposo (opcional)'],
];
const REGISTRALES: [keyof FormState, string, boolean][] = [
  ['numero_acta', 'Acta', true],
  ['numero_libro', 'Libro', true],
  ['numero_pagina', 'Página', false],
  ['numero_registro', 'Registro', true],
];

export default function MatrimonioForm({ registroId }: { registroId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [numeracionAutomatica, setNumeracionAutomatica] = useState(false);
  const isEdit = Boolean(registroId);

  useEffect(() => {
    if (!registroId) return;
    fetch(`/api/matrimonios/${registroId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (!b) return;
        setForm({
          numero_identidad_esposa: b.numero_identidad_esposa ?? '',
          numero_identidad_esposo: b.numero_identidad_esposo ?? '',
          numero_identidad_madre_esposa: b.numero_identidad_madre_esposa ?? '',
          numero_identidad_padre_esposa: b.numero_identidad_padre_esposa ?? '',
          numero_identidad_madre_esposo: b.numero_identidad_madre_esposo ?? '',
          numero_identidad_padre_esposo: b.numero_identidad_padre_esposo ?? '',
          numero_identidad_madrina: b.numero_identidad_madrina ?? '',
          numero_identidad_padrino: b.numero_identidad_padrino ?? '',
          numero_identidad_sacerdote: b.numero_identidad_sacerdote ?? '',
          fecha_matrimonio: b.fecha_matrimonio ? String(b.fecha_matrimonio).slice(0, 10) : '',
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
      const url = isEdit ? `/api/matrimonios/${registroId}` : '/api/matrimonios';
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
      router.push(`/matrimonios/${isEdit ? registroId : data.id_matrimonio}`);
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error de red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Contrayentes y padrinos (Personas registradas)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {OBLIGATORIOS.map(([field, label]) => (
            <PersonaSelector key={field} label={label} required value={form[field]} onChange={(v) => setField(field, v)} />
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Padres de los contrayentes (opcional)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {OPCIONALES.map(([field, label]) => (
            <PersonaSelector key={field} label={label} value={form[field]} onChange={(v) => setField(field, v)} />
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-sm border border-base-300 bg-base-100 p-6">
        <h3 className="mb-3 font-semibold">Ministro y datos registrales</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MinistroSelector label="Sacerdote" required value={form.numero_identidad_sacerdote} onChange={(v) => setField('numero_identidad_sacerdote', v)} />
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Fecha de Matrimonio <span className="text-error">*</span></span>
            </label>
            <input type="date" className="input input-bordered w-full" value={form.fecha_matrimonio} onChange={(e) => setField('fecha_matrimonio', e.target.value)} required />
          </div>
          {!isEdit && (
            <NumeracionAutomaticaControl
              modulo="matrimonio"
              enabled={numeracionAutomatica}
              onEnabledChange={setNumeracionAutomatica}
              onSuggestion={(s) => setForm((prev) => ({ ...prev, numero_libro: s.numero_libro, numero_registro: s.numero_registro }))}
            />
          )}
          {REGISTRALES.map(([field, label, req]) => (
            <div className="form-control" key={field}>
              <label className="label">
                <span className="label-text font-medium">{label} {req && <span className="text-error">*</span>}</span>
              </label>
              <input type="text" className="input input-bordered w-full" value={form[field]} onChange={(e) => setField(field, e.target.value)} required={req} />
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
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar matrimonio'}
        </button>
      </div>
    </form>
  );
}
