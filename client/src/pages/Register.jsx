import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext.jsx';
import Logo from '../components/Logo.jsx';
import Spinner from '../components/Spinner.jsx';
import { mergeServerDetails, validateRegister } from '../utils/validation';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const nextErrors = validateRegister(form);
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    setSubmitting(true);
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors(mergeServerDetails({}, result.details));
      setFormError(result.message);
      return;
    }

    toast.success('Account created. Welcome aboard!');
    navigate('/dashboard', { replace: true });
  };

  const fields = [
    { name: 'name', label: 'Full name', type: 'text', autoComplete: 'name', placeholder: 'Ada Lovelace' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@company.com' },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      autoComplete: 'new-password',
      placeholder: 'At least 8 characters',
    },
    {
      name: 'confirmPassword',
      label: 'Confirm password',
      type: 'password',
      autoComplete: 'new-password',
      placeholder: 'Repeat your password',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>

      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Start uploading and exploring 3D models in seconds.
        </p>

        {formError ? (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-500/40 bg-red-950/60 px-4 py-3 text-sm text-red-200"
          >
            {formError}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          {fields.map((field) => (
            <div key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                className="input"
                value={form[field.name]}
                onChange={onChange}
              />
              {errors[field.name] ? <p className="field-error">{errors[field.name]}</p> : null}
            </div>
          ))}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? <Spinner className="h-4 w-4" /> : null}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
