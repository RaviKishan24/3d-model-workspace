import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx';
import Spinner from './components/Spinner.jsx';

// Route-level code splitting. The viewer chunk (three + fiber + drei) is only
// downloaded when a user actually opens a model.
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Models = lazy(() => import('./pages/Models.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Viewer = lazy(() => import('./pages/Viewer.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" label="Loading…" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/models" element={<Models />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/viewer/:modelId" element={<Viewer />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
