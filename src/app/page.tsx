import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { checkInstallationStatus } from '@/lib/installation';
import authOptions from '@/lib/auth';

export default async function HomePage() {
  // Verificar si el sistema necesita instalación
  const { isInstalled } = await checkInstallationStatus();
  
  if (!isInstalled) {
    redirect('/setup');
  }

  // Verificar si el usuario ya está autenticado
  const session = await getServerSession(authOptions);
  
  if (session) {
    // Usuario autenticado - redirigir al dashboard
    redirect('/dashboard');
  } else {
    // Usuario no autenticado - redirigir al login
    redirect('/login');
  }
}
