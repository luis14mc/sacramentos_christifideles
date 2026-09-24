import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

// Cada instancia se inicializa en el deploy (seed de scripts/railway-start.mjs);
// no hay asistente de instalación web.
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  redirect(session ? '/dashboard' : '/login');
}
