import Swal from 'sweetalert2';

// Configuración global para SweetAlert2
const defaultConfig = {
  confirmButtonColor: '#590202', // Color primario de la parroquia
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  showCloseButton: true
};

export const useAlerts = () => {
  const showSuccess = (title: string, message?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'success',
      title,
      text: message,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  };

  const showError = (title: string, message?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'error',
      title,
      text: message,
      confirmButtonText: 'Entendido'
    });
  };

  const showWarning = (title: string, message?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'warning',
      title,
      text: message,
      confirmButtonText: 'Entendido'
    });
  };

  const showInfo = (title: string, message?: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'info',
      title,
      text: message,
      confirmButtonText: 'Entendido'
    });
  };

  const showConfirmation = (
    title: string,
    message?: string,
    confirmText: string = 'Sí, confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'warning',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });
  };

  const showDeleteConfirmation = (itemName: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'warning',
      title: '¿Estás seguro?',
      html: `Esta acción eliminará permanentemente <strong>${itemName}</strong>.<br><br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626' // Color rojo para eliminar
    });
  };

  const showDeactivateConfirmation = (itemName: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'question',
      title: '¿Desactivar usuario?',
      html: `¿Estás seguro de que deseas desactivar a <strong>${itemName}</strong>?<br><br>El usuario no podrá acceder al sistema hasta que sea reactivado.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b' // Color amarillo para desactivar
    });
  };

  const showActivateConfirmation = (itemName: string) => {
    return Swal.fire({
      ...defaultConfig,
      icon: 'question',
      title: '¿Reactivar usuario?',
      html: `¿Estás seguro de que deseas reactivar a <strong>${itemName}</strong>?<br><br>El usuario podrá volver a acceder al sistema.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981' // Color verde para reactivar
    });
  };

  const showLoading = (title: string = 'Procesando...', message?: string) => {
    return Swal.fire({
      title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  };

  const closeLoading = () => {
    Swal.close();
  };

  const showToast = (icon: 'success' | 'error' | 'warning' | 'info', title: string) => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon,
      title
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmation,
    showDeleteConfirmation,
    showDeactivateConfirmation,
    showActivateConfirmation,
    showLoading,
    closeLoading,
    showToast
  };
};
