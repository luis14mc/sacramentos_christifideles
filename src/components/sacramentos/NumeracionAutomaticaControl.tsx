'use client';

import { useState } from 'react';

interface Props {
  modulo: 'bautismo' | 'primera_comunion' | 'confirmacion' | 'matrimonio';
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onSuggestion: (sugerencia: { numero_libro: string; numero_registro: string }) => void;
}

export default function NumeracionAutomaticaControl({
  modulo,
  enabled,
  onEnabledChange,
  onSuggestion,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = async (checked: boolean) => {
    setError('');
    if (!checked) {
      onEnabledChange(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/numeradores/${modulo}`);
      if (!res.ok) throw new Error('No se pudo obtener la numeración sugerida');
      const data = await res.json();
      if (!data?.sugerido?.numero_libro || !data?.sugerido?.numero_registro) {
        throw new Error('Respuesta de numeración inválida');
      }
      onSuggestion(data.sugerido);
      onEnabledChange(true);
    } catch (e) {
      onEnabledChange(false);
      setError(e instanceof Error ? e.message : 'No se pudo obtener la numeración sugerida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-control md:col-span-2 rounded-lg border border-base-300 bg-base-200/40 p-3">
      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={enabled}
          disabled={loading}
          onChange={(e) => void toggle(e.target.checked)}
        />
        <span className="label-text">
          {loading ? 'Consultando numeración…' : 'Asignar número de registro automáticamente al guardar'}
        </span>
      </label>
      <p className="text-xs opacity-70">
        Se muestra una sugerencia; al guardar, el servidor reserva el correlativo definitivo de forma atómica.
      </p>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
