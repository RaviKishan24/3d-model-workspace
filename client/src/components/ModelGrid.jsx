import ModelCard from './ModelCard.jsx';
import Spinner from './Spinner.jsx';

/** Shared list surface for the dashboard and My Models pages. */
export default function ModelGrid({
  models,
  loading,
  error,
  isEmpty,
  onDelete,
  onRetry,
  onUploadClick,
}) {
  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-[188px] animate-pulse p-5">
            <div className="h-4 w-2/3 rounded bg-slate-800" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-800/70" />
            <div className="mt-8 h-3 w-1/3 rounded bg-slate-800/70" />
            <div className="mt-8 h-8 rounded bg-slate-800/70" />
          </div>
        ))}
        <div className="sr-only">
          <Spinner label="Loading models" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-red-300">{error}</p>
        <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="card p-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xl text-slate-500">
          ◈
        </span>
        <h3 className="mt-5 text-base font-semibold text-white">No 3D models yet.</h3>
        <p className="mt-1.5 text-sm text-slate-400">
          Upload your first model to get started.
        </p>
        <button type="button" className="btn-primary mt-6" onClick={onUploadClick}>
          Upload Model
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} onDelete={onDelete} />
      ))}
    </div>
  );
}
