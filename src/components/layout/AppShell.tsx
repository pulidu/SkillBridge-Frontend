import { useState, type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: ReactNode;
  /** Controls maximum container width for main content */
  variant?: 'default' | 'fullWidth';
  /** If true, explicitly hides sidebar (only for login/register guest pages) */
  noSidebar?: boolean;
}

/**
 * Application shell. Signed-in users always retain their persistent role sidebar;
 * mobile screens receive an accessible drawer with touch dismissal.
 */
export function AppShell({ children, variant = 'default', noSidebar = false }: AppShellProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showSidebar = isAuthenticated && !noSidebar;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        onToggleSidebar={() => setMobileMenuOpen((prev) => !prev)}
        isSidebarOpen={mobileMenuOpen}
      />

      <div className="flex flex-1 relative">
        {showSidebar ? (
          <>
            {/* Desktop persistent sidebar */}
            <Sidebar className="hidden lg:flex" />

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen ? (
              <div
                className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
            ) : null}

            {/* Mobile Sidebar Drawer */}
            <div
              className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Navigation Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar onItemClick={() => setMobileMenuOpen(false)} className="w-full border-r-0 shadow-none" />
              </div>
            </div>
          </>
        ) : null}

        <main
          className={
            variant === 'fullWidth'
              ? 'mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8'
              : 'mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6'
          }
        >
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
