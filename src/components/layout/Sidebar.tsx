import { NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectPrimaryRole, selectUser, sessionCleared } from '@/features/auth/authSlice';
import { useLogoutMutation } from '@/features/auth/authApi';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: Array<'admin' | 'instructor' | 'student'>;
  end?: boolean;
}

const ITEMS: NavItem[] = [
  // Student items
  { to: '/learn', label: 'Dashboard / My learning', icon: '🏠', roles: ['student'], end: true },
  { to: '/courses', label: 'Browse courses', icon: '📚', roles: ['student'], end: true },
  { to: '/planner', label: 'Study planner', icon: '📅', roles: ['student'], end: true },
  { to: '/planner/weekly', label: 'Weekly schedule', icon: '⏱️', roles: ['student'] },
  { to: '/learn/progress', label: 'My progress', icon: '📊', roles: ['student'] },
  { to: '/learn/submissions', label: 'My submissions', icon: '📝', roles: ['student'] },
  { to: '/learn/certificates', label: 'Certificates', icon: '🎓', roles: ['student'] },

  // Instructor items
  { to: '/instructor', label: 'Dashboard', icon: '🏠', roles: ['instructor'], end: true },
  { to: '/instructor/courses', label: 'My courses', icon: '📚', roles: ['instructor'], end: true },
  { to: '/instructor/courses/new', label: 'Create course', icon: '➕', roles: ['instructor'] },
  { to: '/instructor/submissions', label: 'Grading queue', icon: '📝', roles: ['instructor'] },

  // Admin items
  { to: '/admin', label: 'Dashboard', icon: '🏠', roles: ['admin'], end: true },
  { to: '/admin/users', label: 'User management', icon: '👥', roles: ['admin'] },
  { to: '/admin/courses', label: 'Course management', icon: '📚', roles: ['admin'] },
  { to: '/admin/categories', label: 'Categories', icon: '🏷️', roles: ['admin'] },
  { to: '/admin/enrollments', label: 'Enrollments', icon: '📋', roles: ['admin'] },
  { to: '/admin/submissions', label: 'Submissions', icon: '📝', roles: ['admin'] },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: '🛡️', roles: ['admin'] },
];

export interface SidebarProps {
  onItemClick?: () => void;
  className?: string;
}

/**
 * Workspace navigation. Persistent across all dashboard and feature pages.
 */
export function Sidebar({ onItemClick, className }: SidebarProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const primaryRole = useAppSelector(selectPrimaryRole);
  const [logout] = useLogoutMutation();

  const visible = ITEMS.filter((item) => item.roles.includes(primaryRole));

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Clear session either way
    }
    dispatch(sessionCleared());
    onItemClick?.();
  };

  if (visible.length === 0) return null;

  return (
    <aside
      className={cn(
        'w-64 shrink-0 border-r border-slate-200 bg-white shadow-sm flex flex-col justify-between',
        className,
      )}
    >
      <nav className="p-4 space-y-1">
        <div className="px-3 pb-3 pt-1 border-b border-slate-100 mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
            {primaryRole} Portal
          </span>
          <span className="text-xs text-slate-400">Navigation</span>
        </div>

        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? item.to.split('/').length <= 2}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <span className="text-base select-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout shortcut in Sidebar */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-1">
        <NavLink
          to="/profile"
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900',
            )
          }
        >
          <span className="text-base">👤</span>
          <span className="truncate">Profile ({user?.fullName ?? 'My Account'})</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <span className="text-base">🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
