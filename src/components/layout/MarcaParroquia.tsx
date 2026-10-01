'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/** Evento que emite la pantalla de Datos de la parroquia al cambiar el logo. */
export const EVENTO_LOGO_ACTUALIZADO = 'logo-parroquia-actualizado';

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || 'P';
}

/** Logo + nombre de la parroquia de la sesión, para el encabezado. */
export default function MarcaParroquia() {
  const { data: session } = useSession();
  const nombre = session?.user?.parish || 'Parroquia';
  const [version, setVersion] = useState(0);
  const [sinLogo, setSinLogo] = useState(false);

  useEffect(() => {
    const recargar = () => {
      setSinLogo(false);
      setVersion((v) => v + 1);
    };
    window.addEventListener(EVENTO_LOGO_ACTUALIZADO, recargar);
    return () => window.removeEventListener(EVENTO_LOGO_ACTUALIZADO, recargar);
  }, []);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200">
        {sinLogo || !session ? (
          <span className="text-sm font-bold text-primary">{iniciales(nombre)}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- imagen privada servida por la API
          <img
            src={`/api/configuracion/parroquia/logo?v=${version}`}
            alt=""
            className="h-full w-full object-contain"
            onError={() => setSinLogo(true)}
          />
        )}
      </div>
      <span className="truncate text-base font-semibold text-base-content sm:text-lg" title={nombre}>
        {nombre}
      </span>
    </div>
  );
}
