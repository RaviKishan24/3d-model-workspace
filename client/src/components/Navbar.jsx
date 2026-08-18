import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext.jsx';
import Logo from './Logo.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/models', label: 'My Models' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been signed out');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-slate-400">{user?.name}</span>
          <button type="button" onClick={handleLogout} className="btn-secondary btn-sm">
            Logout
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost btn-sm md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-800 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-sm text-slate-400">{user?.name}</span>
            <button type="button" onClick={handleLogout} className="btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
