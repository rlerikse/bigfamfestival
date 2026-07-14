import { Outlet } from 'react-router-dom';
import { EnvBanner } from './EnvBanner';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Env banner - structural, pushes content down */}
      <EnvBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-6 bg-[#FAFAF2]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
