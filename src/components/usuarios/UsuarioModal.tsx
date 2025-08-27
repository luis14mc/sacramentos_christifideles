'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAlerts } from '@/hooks/useAlerts';

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

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | 'delete';
  usuario?: Usuario | null;
  onSuccess: () => void;
}

export default function UsuarioModal({ isOpen, onClose, mode, usuario, onSuccess }: UsuarioModalProps) {
  const { data: session } = useSession();
  const alerts = useAlerts();
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    rol: '',
    activo: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar roles disponibles
  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetch('/api/roles');
        if (response.ok) {
          const roles = await response.json();
          setRolesDisponibles(roles);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    }

    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (usuario && (mode === 'edit' || mode === 'view')) {
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono || '',
        password: '',
        confirmPassword: '',
        rol: usuario.rol,
        activo: usuario.activo
      });
    } else if (mode === 'create') {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        rol: '', // Se establecerá cuando se carguen los roles
        activo: true
      });
    }
    setErrors({});
  }, [usuario, mode, isOpen]);

  // Establecer el rol por defecto cuando se cargan los roles para modo crear
  useEffect(() => {
    if (mode === 'create' && rolesDisponibles.length > 0 && formData.rol === '') {
      setFormData(prev => ({ ...prev, rol: rolesDisponibles[0].nombre }));
    }
  }, [rolesDisponibles, mode, formData.rol]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.rol) {
      newErrors.rol = 'El rol es requerido';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Mostrar loading
      alerts.showLoading(
        mode === 'create' ? 'Creando usuario...' : 'Actualizando usuario...',
        'Por favor espera mientras procesamos la información'
      );

      const endpoint = '/api/usuarios';
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const payload = {
        ...(mode === 'edit' && { id: usuario?.id }),
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        rol: formData.rol,
        activo: formData.activo,
        ...(mode === 'create' && { parroquiaId: session?.user?.parishId }),
        ...(formData.password && { password: formData.password })
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      alerts.closeLoading();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al procesar la solicitud');
      }

      // Mostrar éxito
      await alerts.showSuccess(
        mode === 'create' ? '¡Usuario creado!' : '¡Usuario actualizado!',
        mode === 'create' 
          ? `El usuario ${formData.nombre} ha sido creado exitosamente.`
          : `Los datos de ${formData.nombre} han sido actualizados.`
      );

      onSuccess();
      onClose();
    } catch (error) {
      alerts.closeLoading();
      console.error('Error submitting form:', error);
      
      await alerts.showError(
        'Error al procesar',
        error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!usuario) return;

    // Mostrar confirmación personalizada
    const result = await alerts.showDeleteConfirmation(usuario.nombre);
    
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Mostrar loading
      alerts.showLoading('Eliminando usuario...', 'Esta acción no se puede deshacer');

      const response = await fetch(`/api/usuarios?id=${usuario.id}`, {
        method: 'DELETE',
      });

      alerts.closeLoading();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      // Mostrar éxito
      await alerts.showSuccess(
        '¡Usuario eliminado!',
        `${usuario.nombre} ha sido eliminado del sistema exitosamente.`
      );

      onSuccess();
      onClose();
    } catch (error) {
      alerts.closeLoading();
      console.error('Error deleting user:', error);
      
      await alerts.showError(
        'Error al eliminar',
        error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Crear Usuario';
      case 'edit':
        return 'Editar Usuario';
      case 'view':
        return 'Detalles del Usuario';
      case 'delete':
        return 'Eliminar Usuario';
      default:
        return 'Usuario';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-base-content">{getModalTitle()}</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {mode === 'delete' ? (
          <div>
            <div className="bg-base-200 p-4 rounded-lg mb-6">
              <p><strong>Nombre:</strong> {usuario?.nombre}</p>
              <p><strong>Email:</strong> {usuario?.email}</p>
              <p><strong>Rol:</strong> {usuario?.rol}</p>
            </div>

            <div className="modal-action">
              <button
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cerrar
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-error"
              >
                Eliminar Usuario
              </button>
            </div>
          </div>
        ) : mode === 'view' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Nombre</span>
                </label>
                <p className="text-base-content">{usuario?.nombre}</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <p className="text-base-content">{usuario?.email}</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Teléfono</span>
                </label>
                <p className="text-base-content">{usuario?.telefono || 'N/A'}</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Rol</span>
                </label>
                <p className="text-base-content">{usuario?.rol}</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Estado</span>
                </label>
                <span className={`badge ${usuario?.activo ? 'badge-success' : 'badge-error'}`}>
                  {usuario?.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Fecha de Registro</span>
                </label>
                <p className="text-base-content">
                  {usuario ? new Date(usuario.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button onClick={onClose} className="btn btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nombre *</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered ${errors.nombre ? 'input-error' : ''}`}
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  disabled={isSubmitting}
                />
                {errors.nombre && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.nombre}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email *</span>
                </label>
                <input
                  type="email"
                  className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.email}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Teléfono</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Rol *</span>
                </label>
                <select
                  className={`select select-bordered ${errors.rol ? 'select-error' : ''}`}
                  value={formData.rol}
                  onChange={(e) => setFormData(prev => ({ ...prev, rol: e.target.value }))}
                  disabled={isSubmitting}
                >
                  {rolesDisponibles.map((rol) => (
                    <option key={rol.id} value={rol.nombre}>{rol.nombre}</option>
                  ))}
                </select>
                {errors.rol && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.rol}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {mode === 'create' ? 'Contraseña *' : 'Nueva Contraseña'}
                  </span>
                </label>
                <input
                  type="password"
                  className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isSubmitting}
                  placeholder={mode === 'edit' ? 'Dejar vacío para no cambiar' : ''}
                />
                {errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.password}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {mode === 'create' ? 'Confirmar Contraseña *' : 'Confirmar Nueva Contraseña'}
                  </span>
                </label>
                <input
                  type="password"
                  className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.confirmPassword}</span>
                  </label>
                )}
              </div>

              <div className="form-control col-span-full">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mr-3"
                    checked={formData.activo}
                    onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                    disabled={isSubmitting}
                  />
                  <span className="label-text">Usuario activo</span>
                </label>
              </div>
            </div>

            {errors.submit && (
              <div className="alert alert-error mt-4">
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="loading loading-spinner loading-sm mr-2"></span>}
                {mode === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
