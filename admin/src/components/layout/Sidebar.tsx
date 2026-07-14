import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Music2,
  CalendarDays,
  Calendar,
  Clock,
  Bell,
  Store,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/artists', icon: Music2, label: 'Artists' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/shifts', icon: Clock, label: 'Shifts' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/vendors', icon: Store, label: 'Vendors' },
  { to: '/map', icon: MapPin, label: 'Map' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-full bg-gradient-to-b from-[#2E4031] to-[#1C2B20] flex flex-col transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo area */}
      <div className="h-14 flex items-center px-4 border-b border-[#F5F5DC]/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Big Fam" className="h-8 w-8 rounded" />
            <span className="font-bold text-lg text-[#F5F5DC]">Big Fam</span>
          </div>
        )}
        {collapsed && <img src="/logo.png" alt="Big Fam" className="h-8 w-8 rounded mx-auto" />}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#6BBF59] text-[#2E4031] font-bold'
                  : 'text-[#F5F5DC]/[0.78] hover:bg-white/[0.08] hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-[#F5F5DC]/10 text-[#F5F5DC]/[0.78] hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
