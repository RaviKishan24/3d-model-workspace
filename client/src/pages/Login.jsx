import { useState,useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext.jsx';
import Logo from '../components/Logo.jsx';
import Spinner from '../components/Spinner.jsx';
import { mergeServerDetails, validateLogin } from '../utils/validation';

export default function Login() {
const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from || '/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, location.state?.from]);


  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const nextErrors = validateLogin(form);
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    setSubmitting(true);
    const result = await login({ email: form.email.trim(), password: form.password });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(mergeServerDetails({}, result.details));
      setFormError(result.message);
      return;
    }

    toast.success(`Welcome back, ${result.user.name}`);
  
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>

      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Access your 3D models and saved views.</p>

        {formError ? (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-500/40 bg-red-950/60 px-4 py-3 text-sm text-red-200"
          >
            {formError}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="input"
              placeholder="you@company.com"
              value={form.email}
              onChange={onChange}
            />
            {errors.email ? <p className="field-error">{errors.email}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
            />
            {errors.password ? <p className="field-error">{errors.password}</p> : null}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? <Spinner className="h-4 w-4" /> : null}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
