import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-brand-400">404</p>
        <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you were looking for doesn&apos;t exist or has moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
