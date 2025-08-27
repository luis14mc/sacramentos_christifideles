'use client';

import { useCanAccess } from '@/hooks/usePermissions';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SacramentoActionButtonsProps {
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly itemId?: number;
  readonly itemName?: string;
  readonly showEdit?: boolean;
  readonly showDelete?: boolean;
}

export function SacramentoActionButtons({
  onEdit,
  onDelete,
  itemId,
  itemName,
  showEdit = true,
  showDelete = true
}: SacramentoActionButtonsProps) {
  const { canAccess, userRole } = useCanAccess();

  const canEdit = canAccess('canEditSacramentos');
  const canDelete = canAccess('canDeleteSacramentos');

  const getTooltipMessage = (action: string) => {
    if (userRole === 'secretario') {
      return `Los secretarios no pueden ${action} registros de sacramentos`;
    }
    return `No tienes permisos para ${action} este registro`;
  };

  return (
    <div className="flex items-center gap-2">
      {showEdit && (
        <button
          onClick={canEdit ? onEdit : undefined}
          className={`btn btn-ghost btn-sm ${
            canEdit 
              ? 'hover:bg-primary/10 hover:text-primary' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          disabled={!canEdit}
          title={canEdit ? 'Editar registro' : getTooltipMessage('editar')}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      )}
      
      {showDelete && (
        <button
          onClick={canDelete ? onDelete : undefined}
          className={`btn btn-ghost btn-sm ${
            canDelete 
              ? 'text-error hover:bg-error/10' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          disabled={!canDelete}
          title={canDelete ? 'Eliminar registro' : getTooltipMessage('eliminar')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface CreateSacramentoButtonProps {
  readonly onClick: () => void;
  readonly label?: string;
  readonly className?: string;
}

export function CreateSacramentoButton({
  onClick,
  label = 'Nuevo Registro',
  className = ''
}: CreateSacramentoButtonProps) {
  const { canAccess, userRole } = useCanAccess();

  const canCreate = canAccess('canCreateSacramentos');

  const getTooltipMessage = () => {
    if (userRole === 'secretario') {
      return 'Los secretarios pueden crear nuevos registros de sacramentos';
    }
    if (!canCreate) {
      return 'No tienes permisos para crear registros';
    }
    return 'Crear nuevo registro';
  };

  return (
    <button
      onClick={canCreate ? onClick : undefined}
      className={`btn btn-primary gap-2 ${
        canCreate 
          ? '' 
          : 'opacity-50 cursor-not-allowed'
      } ${className}`}
      disabled={!canCreate}
      title={getTooltipMessage()}
    >
      <PlusIcon className="h-4 w-4" />
      {label}
    </button>
  );
}

// Componente de aviso específico para secretarios en sacramentos
export function SacramentoSecretaryNotice() {
  const { userRole } = useCanAccess();

  if (userRole !== 'secretario') {
    return null;
  }

  return (
    <div className="alert alert-info mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <h3 className="font-medium">Permisos de Secretario</h3>
        <div className="text-sm">
          Puedes crear nuevos registros de sacramentos, pero no editarlos ni eliminarlos una vez guardados.
        </div>
      </div>
    </div>
  );
}
