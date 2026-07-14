import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { RequireAdmin } from '@/guards/RequireAdmin';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { ArtistsPage } from '@/pages/ArtistsPage';
import { EventsPage } from '@/pages/EventsPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { ShiftsPage } from '@/pages/ShiftsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { VendorsPage } from '@/pages/VendorsPage';
import { LoginPage } from '@/pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* All admin routes wrapped in RequireAdmin */}
        <Route
          element={
            <RequireAdmin>
              <AppShell />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="shifts" element={<ShiftsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="vendors" element={<VendorsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
