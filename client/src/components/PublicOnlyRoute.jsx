import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Spinner from './Spinner.jsx';

/** Keeps signed-in users away from /login and /register. */
export default function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
