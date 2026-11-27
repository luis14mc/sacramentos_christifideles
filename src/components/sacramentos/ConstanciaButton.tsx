'use client';

import { useEffect, useState } from 'react';
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface Firmantes {
  parroco: string | null;
  vicario: string | null;
}

type FirmanteOpcion = 'parroco' | 'vicario';

function urlCertificacion(sacramento: string, id: string, firmante: FirmanteOpcion, papelCuria = false): string {
  const params = new URLSearchParams();
  if (firmante === 'vicario') params.set('firmante', 'vicario');
  if (papelCuria) params.set('papel', 'curia');
  const qs = params.toString();
  return `/api/constancias/${sacramento}/${id}${qs ? `?${qs}` : ''}`;
}

/**
 * Imprime un PDF desde un iframe oculto (abre el diálogo de impresión del
 * navegador). Si el navegador no lo permite, abre el PDF en otra pestaña.
 */
function imprimirPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  const limpiar = () => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Se deja tiempo para que el diálogo de impresión lea el documento.
    setTimeout(limpiar, 60_000);
  };
  iframe.src = url;
  document.body.appendChild(iframe);
}

// Certificación PDF de cualquier sacramento: descargar o imprimir sobre el
// papel sellado de la Curia. El endpoint es tenant-safe y obtiene todos los
// datos del servidor; aquí solo se elige quién firma y el tipo de papel.
export default function ConstanciaButton({ sacramento, id }: { sacramento: string; id: string }) {
  const [firmantes, setFirmantes] = useState<Firmantes | null>(null);
  const [firmante, setFirmante] = useState<FirmanteOpcion>('parroco');
  const [imprimiendo, setImprimiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch('/api/constancias/firmantes')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Firmantes | null) => {
        if (cancelado) return;
        const f = d ?? { parroco: null, vicario: null };
        setFirmantes(f);
        // Sin párroco configurado, firma el vicario.
        if (!f.parroco && f.vicario) setFirmante('vicario');
      })
      .catch(() => {
        if (!cancelado) setFirmantes({ parroco: null, vicario: null });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const imprimir = async () => {
    setImprimiendo(true);
    setError(null);
    try {
      const res = await fetch(urlCertificacion(sacramento, id, firmante, true));
      if (!res.ok) {
        const cuerpo = await res.json().catch(() => null);
        setError(cuerpo?.error ?? 'No se pudo generar la certificación.');
        return;
      }
      imprimirPdf(await res.blob());
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setImprimiendo(false);
    }
  };

  if (firmantes && !firmantes.parroco && !firmantes.vicario) {
    return (
      <div className="flex flex-col gap-1">
        <button type="button" className="btn btn-outline btn-sm" disabled>
          <DocumentArrowDownIcon className="h-4 w-4" /> Certificación PDF
        </button>
        <span className="text-xs text-warning">
          Configure el párroco en Configuración → Datos de la parroquia para emitir certificaciones.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {firmantes?.vicario && (
          <select
            className="select select-bordered select-sm"
            aria-label="Quién firma la certificación"
            value={firmante}
            onChange={(e) => setFirmante(e.target.value as FirmanteOpcion)}
          >
            {firmantes.parroco && <option value="parroco">Firma el párroco: {firmantes.parroco}</option>}
            <option value="vicario">Firma el vicario: {firmantes.vicario}</option>
          </select>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={imprimir}
          disabled={imprimiendo}
          title="Imprime sin encabezado, para el papel sellado de la Curia"
        >
          <PrinterIcon className="h-4 w-4" /> {imprimiendo ? 'Preparando…' : 'Imprimir en papel de la Curia'}
        </button>
        <a
          href={urlCertificacion(sacramento, id, firmante)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
        >
          <DocumentArrowDownIcon className="h-4 w-4" /> Descargar PDF
        </a>
      </div>
      <span className="text-xs text-base-content/60">
        Al imprimir, elija tamaño carta y escala 100 % (tamaño real).
      </span>
      {error && (
        <span role="alert" className="text-xs text-error">
          {error}
        </span>
      )}
    </div>
  );
}
