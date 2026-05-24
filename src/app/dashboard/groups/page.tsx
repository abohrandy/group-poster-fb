import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma, { checkDatabaseConnection } from '@/lib/db';
import AddGroupForm from '@/app/components/AddGroupForm';
import GroupsTable from '@/app/components/GroupsTable';
import GroupFilters from '@/app/components/GroupFilters';
import AutomatedSearchForm from '@/app/components/AutomatedSearchForm';
import { Users, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await validateSession();
  if (!session) {
    redirect('/login');
  }

  const { connected } = await checkDatabaseConnection();
  const resolvedSearchParams = await searchParams;

  const search = resolvedSearchParams.search || '';
  const status = resolvedSearchParams.status || '';
  const allowsPagesParam = resolvedSearchParams.allowsPages;

  let groups: any[] = [];
  let statuses: string[] = ['NOT_JOINED', 'JOIN_PENDING', 'JOINED', 'BLACKLISTED'];

  if (connected) {
    try {
      // Build Prisma Query filters
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { url: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (allowsPagesParam === 'true') {
        whereClause.allowsPages = true;
      } else if (allowsPagesParam === 'false') {
        whereClause.allowsPages = false;
      }

      groups = await prisma.facebookGroup.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Failed to query groups from database:', err);
    }
  } else {
    // Simulated Offline fallback data
    const mockGroups = [
      {
        id: 'mock-group-1',
        name: 'London Marketing & Social Media Community',
        url: 'https://facebook.com/groups/londonmarketing',
        membersCount: 12500,
        dailyPosts: 8,
        allowsPages: true,
        status: 'JOINED',
        notes: 'Very active group, great for testing post interactions.',
        createdAt: new Date(),
      },
      {
        id: 'mock-group-2',
        name: 'UK Tech Startup & Developers Hub',
        url: 'https://facebook.com/groups/uktechstartups',
        membersCount: 8400,
        dailyPosts: 3,
        allowsPages: false,
        status: 'NOT_JOINED',
        notes: 'Developers community. Restricted to personal user profiles only.',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'mock-group-3',
        name: 'Real Estate Investors Network - London',
        url: 'https://facebook.com/groups/londonrealestate',
        membersCount: 4200,
        dailyPosts: 0,
        allowsPages: true,
        status: 'JOIN_PENDING',
        notes: 'Join request pending approval. High levels of spam.',
        createdAt: new Date(Date.now() - 7200000),
      },
    ];

    // Filter mock groups locally for simulation
    groups = mockGroups.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.url.toLowerCase().includes(search.toLowerCase())) return false;
      if (status && g.status !== status) return false;
      if (allowsPagesParam === 'true' && !g.allowsPages) return false;
      if (allowsPagesParam === 'false' && g.allowsPages) return false;
      return true;
    });
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" />
            Group Discovery Directory
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage target Facebook groups, configure location filters, and check membership settings.</p>
        </div>

        {connected && <AddGroupForm />}
      </div>

      {/* Database Offline Warning */}
      {!connected && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex gap-3 items-start backdrop-blur-md">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-rose-300">Database Offline (Simulation Mode)</h4>
            <p className="text-rose-400/80 mt-1">
              Groups directory is currently running in local simulation mode. Manual group registration is disabled until a PostgreSQL connection is established.
            </p>
          </div>
        </div>
      )}

      {/* Automated Search Section */}
      <AutomatedSearchForm />

      {/* Filter panel */}
      <GroupFilters statuses={statuses} />

      {/* List Table */}
      <GroupsTable groups={groups} facebookPageName={session?.user?.facebookPageName || "Mayor's Page"} />
    </div>
  );
}
