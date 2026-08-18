import { useEffect, useState } from 'react';
import Spinner from '../Spinner.jsx';

const presets = ['Front View', 'Side View', 'Top View', 'Detail View'];

export default function SaveViewDialog({ open, busy, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give this view a name');
    return onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6" noValidate>
        <h2 className="text-lg font-semibold text-white">Save current view</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          The camera position, rotation, zoom and orbit target are stored with your account.
        </p>

        <label className="label mt-5" htmlFor="view-name">
          View name
        </label>
        <input
          id="view-name"
          className="input"
          placeholder="Front View"
          value={name}
          maxLength={60}
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          disabled={busy}
        />
        {error ? <p className="field-error">{error}</p> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className="btn-ghost btn-sm border border-slate-800"
              onClick={() => setName(preset)}
              disabled={busy}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : null}
            Save view
          </button>
        </div>
      </form>
    </div>
  );
}
