import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsForm from '@/app/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const session = await validateSession();
  if (!session) {
    redirect('/login');
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Configure your dashboard credentials and monitor platform integrations.</p>
      </div>

      <SettingsForm initialName={user.name} email={user.email} />
    </div>
  );
}
