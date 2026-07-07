'use client';

import { logger } from '@/lib/logger';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  ChartBarIcon,
  UsersIcon,
  BookOpenIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

interface ReportesData {
  resumen: {
    totalPersonas: number;
    totalBautismos: number;
    totalPrimerasComuniones: number;
    totalConfirmaciones: number;
    totalMatrimonios: number;
    totalUsuarios: number;
    usuariosActivos: number;
  };
  porSacramento: Array<{
    tipo: string;
    label: string;
    total: number;
    esteAno: number;
  }>;
  personasPorSexo: { masculino: number; femenino: number };
  recientes: Array<{
    tipo: string;
    label: string;
    id: string;
    nombre: string;
    fecha: string;
  }>;
  anioActual: number;
}

const ICONOS: Record<string, React.ComponentType<{ className?: string }>> = {
  bautismo: BookOpenIcon,
  primera_comunion: DocumentCheckIcon,
  confirmacion: ClipboardDocumentListIcon,
  matrimonio: HeartIcon,
};

function ReportesPageContent() {
  const router = useRouter();
  const [data, setData] = useState<ReportesData | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reportes');
      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      logger.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const rutasModulo: Record<string, string> = {
    bautismo: '/bautismos',
    primera_comunion: '/primera-comunion',
    confirmacion: '/confirmaciones',
    matrimonio: '/matrimonios',
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!data) {
    return (
      <AuthenticatedLayout>
        <div className="p-6 text-center text-base-content/60">
          No se pudieron cargar los reportes.
        </div>
      </AuthenticatedLayout>
    );
  }

  const totalSacramentos =
    data.resumen.totalBautismos +
    data.resumen.totalPrimerasComuniones +
    data.resumen.totalConfirmaciones +
    data.resumen.totalMatrimonios;

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-base-200/30">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-info/20 rounded-xl flex items-center justify-center shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Reportes</h1>
                  <p className="text-base-content/70 text-sm mt-1">
                    Estadísticas y actividad sacramental — {data.anioActual}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-8 w-8 text-info" />
                  <div>
                    <p className="text-sm text-base-content/60">Personas</p>
                    <p className="text-2xl font-bold">{data.resumen.totalPersonas}</p>
                  </div>
                </div>
              </div>
              <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm text-base-content/60">Total sacramentos</p>
                    <p className="text-2xl font-bold">{totalSacramentos}</p>
                  </div>
                </div>
              </div>
              <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                <p className="text-sm text-base-content/60 mb-1">Personas por sexo</p>
                <p className="text-sm">
                  Masculino: <strong>{data.personasPorSexo.masculino}</strong>
                </p>
                <p className="text-sm">
                  Femenino: <strong>{data.personasPorSexo.femenino}</strong>
                </p>
              </div>
              <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                <p className="text-sm text-base-content/60 mb-1">Usuarios del sistema</p>
                <p className="text-2xl font-bold">{data.resumen.totalUsuarios}</p>
                <p className="text-xs text-base-content/60">
                  {data.resumen.usuariosActivos} activos
                </p>
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
              <div className="p-4 border-b border-base-300">
                <h2 className="font-semibold">Sacramentos por tipo ({data.anioActual})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sacramento</th>
                      <th>Total histórico</th>
                      <th>Este año</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.porSacramento.map((s) => {
                      const Icon = ICONOS[s.tipo] ?? ChartBarIcon;
                      return (
                        <tr key={s.tipo}>
                          <td>
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-primary" />
                              {s.label}
                            </div>
                          </td>
                          <td className="font-mono">{s.total.toLocaleString()}</td>
                          <td className="font-mono">{s.esteAno.toLocaleString()}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => router.push(rutasModulo[s.tipo] ?? '/dashboard')}
                            >
                              Ver módulo
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
              <div className="p-4 border-b border-base-300">
                <h2 className="font-semibold">Registros recientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Persona(s)</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recientes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-base-content/60">
                          No hay registros recientes
                        </td>
                      </tr>
                    ) : (
                      data.recientes.map((r) => (
                        <tr key={`${r.tipo}-${r.id}`}>
                          <td>
                            <span className="badge badge-ghost">{r.label}</span>
                          </td>
                          <td>{r.nombre}</td>
                          <td>{formatFecha(r.fecha)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function ReportesPage() {
  return (
    <ProtectedRoute requiredPermission="canViewReportes">
      <ReportesPageContent />
    </ProtectedRoute>
  );
}
