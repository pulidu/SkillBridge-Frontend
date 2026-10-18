import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <p>
          {APP_NAME} · individual RAD coursework project
        </p>

        <nav className="flex items-center gap-4">
          <Link to="/courses" className="transition-colors hover:text-slate-800">
            Catalog
          </Link>
          <Link to="/verify" className="transition-colors hover:text-slate-800">
            Verify certificate
          </Link>
        </nav>
      </div>
    </footer>
  );
}
