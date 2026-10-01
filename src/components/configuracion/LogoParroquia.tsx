'use client';

import { useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { EVENTO_LOGO_ACTUALIZADO } from '@/components/layout/MarcaParroquia';

/** Vista previa, carga y eliminación del logo de la parroquia. */
export default function LogoParroquia({
  tieneLogo: tieneLogoInicial,
  puedeGestionar,
}: {
  tieneLogo: boolean;
  puedeGestionar: boolean;
}) {
  const [tieneLogo, setTieneLogo] = useState(tieneLogoInicial);
  const [version, setVersion] = useState(0); // fuerza recarga de la vista previa
  const [subiendo, setSubiendo] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const subir = async (archivo: File) => {
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('logo', archivo);
      const res = await fetch('/api/configuracion/parroquia/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        await Swal.fire({ icon: 'error', title: 'No se pudo subir el logo', text: data.error });
        return;
      }
      setTieneLogo(true);
      setVersion((v) => v + 1);
      window.dispatchEvent(new Event(EVENTO_LOGO_ACTUALIZADO));
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = '';
    }
  };

  const quitar = async () => {
    const ok = await Swal.fire({
      title: '¿Quitar el logo?',
      text: 'Las constancias sin molde membretado dejarán de mostrarlo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
    });
    if (!ok.isConfirmed) return;
    const res = await fetch('/api/configuracion/parroquia/logo', { method: 'DELETE' });
    if (res.ok) {
      setTieneLogo(false);
      window.dispatchEvent(new Event(EVENTO_LOGO_ACTUALIZADO));
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200">
        {tieneLogo ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagen privada servida por la API
          <img src={`/api/configuracion/parroquia/logo?v=${version}`} alt="Logo de la parroquia" className="h-full w-full object-contain" />
        ) : (
          <PhotoIcon className="h-10 w-10 text-base-content/30" />
        )}
      </div>
      <div className="space-y-2">
        <p className="font-semibold">Logo de la parroquia</p>
        <p className="text-sm text-base-content/70">
          PNG o JPG, máximo 1 MB. Aparece en las constancias que no usan una hoja membretada propia.
        </p>
        {puedeGestionar && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])}
            />
            <button type="button" className="btn btn-primary btn-sm" disabled={subiendo} onClick={() => input.current?.click()}>
              {subiendo ? 'Subiendo…' : tieneLogo ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {tieneLogo && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={quitar}>
                Quitar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
