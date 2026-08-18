import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Spinner from './Spinner.jsx';

/** Gate for /dashboard, /models, /viewer/:modelId and /profile. */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user was heading so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
