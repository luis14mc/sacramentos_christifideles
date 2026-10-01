import { redirect } from 'next/navigation';

export default function MoldesRedirect() {
  redirect('/configuracion/constancias?tab=molde');
}