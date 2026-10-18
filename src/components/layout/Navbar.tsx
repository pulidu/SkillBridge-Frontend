import { Link, NavLink } from 'react-router-dom';
import { useLogoutMutation } from '@/features/auth/authApi';
import { sessionCleared } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';
import { useGetUnreadCountQuery } from '@/features/notifications/notificationsApi';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/cn';

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/courses', label: 'Courses', end: false },
];

export interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [logout] = useLogoutMutation();

  // Only polls the badge for signed-in users; guests skip the request.
  const { data: unread } = useGetUnreadCountQuery(undefined, { skip: !user });
  const unreadCount = unread?.count ?? 0;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      /* the local session is cleared either way */
    }
    dispatch(sessionCleared());
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {user && onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        ) : null}

        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
            SB
          </span>
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user ? (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              Dashboard
            </NavLink>
          ) : null}

          {PUBLIC_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <BellIcon />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {user.initials || user.fullName.charAt(0)}
                </span>
                <span className="hidden text-sm font-medium text-slate-700 sm:block">
                  {user.fullName}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
      />
    </svg>
  );
}
