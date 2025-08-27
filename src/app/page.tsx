import { redirect } from 'next/navigation';
import { checkInstallationStatus } from '@/lib/installation';

export default async function HomePage() {
  // Verificar si el sistema necesita instalación
  const { isInstalled } = await checkInstallationStatus();
  
  if (!isInstalled) {
    redirect('/setup');
  } else {
    redirect('/login');
  }
}
