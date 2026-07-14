/** Returns Tailwind classes for role-specific badge styling */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-[#ef4444] text-white border-transparent';
    case 'staff':
      return 'bg-[#f97316] text-white border-transparent';
    case 'artist':
      return 'bg-[#a855f7] text-white border-transparent';
    case 'director':
      return 'bg-[#ec4899] text-white border-transparent';
    case 'vendor':
      return 'bg-[#14b8a6] text-white border-transparent';
    case 'volunteer':
      return 'bg-[#3b82f6] text-white border-transparent';
    case 'attendee':
      return 'bg-[#6b7280] text-white border-transparent';
    default:
      return 'bg-[#6b7280] text-white border-transparent';
  }
}
