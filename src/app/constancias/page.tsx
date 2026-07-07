'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCanAccess } from '@/hooks/usePermissions';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

interface PersonaResult {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  sexo: string;
}

interface SacramentoItem {
  tipo: string;
  id: string;
  fecha: string;
  descripcion: string;
}

function ConstanciasPageContent() {
  const { canAccess } = useCanAccess();
  const puedeGenerar = canAccess('canGenerateConstancias');

  const [identidad, setIdentidad] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [persona, setPersona] = useState<PersonaResult | null>(null);
  const [sacramentos, setSacramentos] = useState<SacramentoItem[]>([]);
  const [seleccionado, setSeleccionado] = useState<SacramentoItem | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identidad.trim()) return;

    setBuscando(true);
    setPersona(null);
    setSacramentos([]);
    setSeleccionado(null);
    setVistaPrevia(null);

    try {
      const response = await fetch(
        `/api/constancias/buscar?identidad=${encodeURIComponent(identidad.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo buscar',
          confirmButtonColor: '#ef4444',
        });
        return;
      }

      setPersona(data.persona);
      setSacramentos(data.sacramentos);

      if (!data.persona) {
        await Swal.fire({
          icon: 'info',
          title: 'Sin resultados',
          text: 'No se encontró ninguna persona con esa identidad.',
          confirmButtonColor: '#590202',
        });
      } else if (data.sacramentos.length === 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Sin sacramentos',
          text: 'La persona no tiene registros sacramentales en esta parroquia.',
          confirmButtonColor: '#590202',
        });
      }
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setBuscando(false);
    }
  };

  const generar = async () => {
    if (!seleccionado || !puedeGenerar) return;

    setGenerando(true);
    try {
      const response = await fetch('/api/constancias/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: seleccionado.tipo,
          registroId: seleccionado.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVistaPrevia(data.html);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'No se pudo generar la constancia',
          confirmButtonColor: '#ef4444',
        });
      }
    } finally {
      setGenerando(false);
    }
  };

  const imprimir = () => {
    if (!vistaPrevia) return;
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.write(vistaPrevia);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-base-200/30">
        <div className="p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Constancias</h1>
                  <p className="text-base-content/70 text-sm mt-1">
                    Generar constancias sacramentales oficiales
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-base-content/40" />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Número de identidad de la persona..."
                    value={identidad}
                    onChange={(e) => setIdentidad(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={buscando}>
                  {buscando ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Buscar'
                  )}
                </button>
              </form>
            </div>

            {persona && (
              <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    {persona.nombres} {persona.apellidos}
                  </h2>
                  <p className="text-sm text-base-content/60">
                    {persona.numero_identidad} · {persona.sexo === 'M' ? 'Masculino' : 'Femenino'}
                  </p>
                </div>

                {sacramentos.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-base-content/70">
                      Seleccione el registro sacramental:
                    </p>
                    <div className="space-y-2">
                      {sacramentos.map((s) => (
                        <label
                          key={`${s.tipo}-${s.id}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            seleccionado?.id === s.id && seleccionado?.tipo === s.tipo
                              ? 'border-primary bg-primary/5'
                              : 'border-base-300 hover:bg-base-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="sacramento"
                            className="radio radio-primary"
                            checked={
                              seleccionado?.id === s.id && seleccionado?.tipo === s.tipo
                            }
                            onChange={() => {
                              setSeleccionado(s);
                              setVistaPrevia(null);
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{s.descripcion}</div>
                            <div className="text-xs text-base-content/60">
                              {formatFecha(s.fecha)}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {puedeGenerar ? (
                      <button
                        type="button"
                        className="btn btn-primary gap-2"
                        disabled={!seleccionado || generando}
                        onClick={generar}
                      >
                        {generando ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          <>
                            <DocumentTextIcon className="h-4 w-4" />
                            Generar constancia
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-sm text-warning">
                        No tiene permisos para generar constancias.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {vistaPrevia && (
              <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                  <h2 className="font-semibold">Vista previa</h2>
                  <button type="button" className="btn btn-sm btn-primary gap-2" onClick={imprimir}>
                    <PrinterIcon className="h-4 w-4" />
                    Imprimir
                  </button>
                </div>
                <iframe
                  title="Vista previa de constancia"
                  srcDoc={vistaPrevia}
                  className="w-full min-h-[480px] bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function ConstanciasPage() {
  return (
    <ProtectedRoute requiredPermission="canViewConstancias">
      <ConstanciasPageContent />
    </ProtectedRoute>
  );
}
