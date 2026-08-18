import Spinner from '../Spinner.jsx';

const fmt = (n) => Number(n).toFixed(2);

export default function SavedViewsPanel({
  views,
  loading,
  error,
  onLoad,
  onDelete,
  onRetry,
  onClose,
  activeViewId,
}) {
  return (
    <aside className="flex h-full w-full flex-col border-slate-800 bg-slate-950/95 lg:w-80 lg:border-l">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Saved Views
        </h2>
        <button type="button" className="btn-ghost btn-sm" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="p-3">
            <Spinner label="Loading views…" />
          </div>
        ) : error ? (
          <div className="p-3 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button type="button" className="btn-secondary btn-sm mt-3" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : views.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm font-medium text-slate-300">No saved views yet</p>
            <p className="mt-1.5 text-xs text-slate-500">
              Frame the model how you like it, then press{' '}
              <span className="font-semibold text-slate-300">Save View</span>. Views are stored in
              your account and stay available after you log out.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {views.map((view) => (
              <li
                key={view.id}
                className={`rounded-lg border p-3 transition ${
                  activeViewId === view.id
                    ? 'border-brand-500/50 bg-brand-500/10'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <p className="truncate text-sm font-semibold text-white" title={view.name}>
                  {view.name}
                </p>
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  pos {fmt(view.camera.position.x)}, {fmt(view.camera.position.y)},{' '}
                  {fmt(view.camera.position.z)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-primary btn-sm flex-1"
                    onClick={() => onLoad(view)}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onDelete(view)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
