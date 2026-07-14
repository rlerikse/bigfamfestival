import { useApiQuery } from '@/hooks/useApi';
import type { DashboardStats } from '@/types';
import { Users, Music2, CalendarDays, Store, Clock, AlertCircle } from 'lucide-react';

// Mock data for when backend isn't running
const mockStats: DashboardStats = {
  totalUsers: 1247,
  totalArtists: 42,
  totalEvents: 86,
  totalVendors: 28,
  upcomingShifts: 156,
  pendingVendors: 5,
};

export function DashboardPage() {
  const { data: stats } = useApiQuery<DashboardStats>(
    ['stats'],
    '/admin/stats',
    undefined,
    { placeholderData: mockStats }
  );

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-600' },
    { label: 'Artists', value: stats?.totalArtists ?? 0, icon: Music2, color: 'text-purple-600' },
    { label: 'Events', value: stats?.totalEvents ?? 0, icon: CalendarDays, color: 'text-green-600' },
    { label: 'Vendors', value: stats?.totalVendors ?? 0, icon: Store, color: 'text-orange-600' },
    { label: 'Upcoming Shifts', value: stats?.upcomingShifts ?? 0, icon: Clock, color: 'text-cyan-600' },
    { label: 'Pending Vendors', value: stats?.pendingVendors ?? 0, icon: AlertCircle, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
