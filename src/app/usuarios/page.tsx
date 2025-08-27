'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import UsuarioModal from '@/components/usuarios/UsuarioModal';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  parroquia: {
    id: number;
    nombre: string;
  };
}

interface ParroquiaData {
  parroquia: {
    id: number;
    nombre: string;
  };
}

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [parroquiaData, setParroquiaData] = useState<ParroquiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete'>('create');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function loadData() {
      if (!session?.user?.id) return;
      
      try {
        // Cargar datos de la parroquia
        const parroquiaResponse = await fetch(`/api/dashboard?userId=${session.user.id}`);
        if (parroquiaResponse.ok) {
          const data = await parroquiaResponse.json();
          setParroquiaData(data.parroquiaData);
        }

        // Cargar usuarios
        const usuariosResponse = await fetch(`/api/usuarios?parroquiaId=${session.user.parishId}`);
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          setUsuarios(usuariosData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      loadData();
    }
  }, [session?.user?.id, session?.user?.parishId]);

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (type: 'create' | 'edit' | 'view' | 'delete', usuario?: Usuario) => {
    setModalType(type);
    setSelectedUsuario(usuario || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsuario(null);
  };

  const handleModalSuccess = () => {
    // Recargar usuarios después de crear/editar/eliminar
    loadUsers();
  };

  const loadUsers = async () => {
    if (!session?.user?.parishId) return;
    
    try {
      const response = await fetch(`/api/usuarios?parroquiaId=${session.user.parishId}`);
      if (response.ok) {
        const usuariosData = await response.json();
        setUsuarios(usuariosData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'badge-primary';
      case 'parroco':
      case 'párroco':
        return 'badge-warning';
      case 'secretario':
      case 'secretaria':
        return 'badge-info';
      case 'usuario':
        return 'badge-neutral';
      default:
        return 'badge-secondary';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-base-200 overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} parroquiaNombre={parroquiaData?.parroquia?.nombre} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-center h-full">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ProtectedRoute requiredPermission="canViewUsuarios">
      <div className="flex h-screen bg-base-200 overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header 
            setSidebarOpen={setSidebarOpen} 
            parroquiaNombre={parroquiaData?.parroquia?.nombre}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center mb-4 sm:mb-0">
                <UsersIcon className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-base-content">Gestión de Usuarios</h1>
                  <p className="text-base-content/60">Administrar usuarios y roles del sistema</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal('create')}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Usuario
              </button>
            </div>

            {/* Search and filters */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      className="input input-bordered w-full pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Users table */}
            <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Fecha Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-primary text-primary-content rounded-full w-10">
                                <span className="text-sm font-semibold">
                                  {usuario.nombre.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-base-content">{usuario.nombre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-base-content/70">{usuario.email}</td>
                        <td className="text-base-content/70">{usuario.telefono || 'N/A'}</td>
                        <td>
                          <span className={`badge ${getRolColor(usuario.rol)}`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${usuario.activo ? 'badge-success' : 'badge-error'}`}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="text-base-content/70">
                          {new Date(usuario.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal('view', usuario)}
                              className="btn btn-sm btn-ghost"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal('edit', usuario)}
                              className="btn btn-sm btn-ghost text-info"
                              title="Editar usuario"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal('delete', usuario)}
                              className="btn btn-sm btn-ghost text-error"
                              title="Eliminar usuario"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsuarios.length === 0 && (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-base-content/30 mx-auto mb-4" />
                    <p className="text-base-content/60">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalType}
        usuario={selectedUsuario}
        onSuccess={handleModalSuccess}
      />
      </div>
    </ProtectedRoute>
  );
}
