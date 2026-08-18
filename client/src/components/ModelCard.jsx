import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatBytes, formatDate } from '../utils/fileValidation';

const typeStyles = {
  glb: 'border-brand-500/40 bg-brand-500/10 text-brand-300',
  gltf: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  obj: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
};

/** memo: the dashboard grid re-renders on upload/delete state changes. */
const ModelCard = memo(function ModelCard({ model, onDelete }) {
  return (
    <article className="card flex flex-col p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-base font-semibold text-white" title={model.name}>
          {model.name}
        </h3>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
            typeStyles[model.fileType] || 'border-slate-700 bg-slate-800 text-slate-300'
          }`}
        >
          {model.fileType}
        </span>
      </div>

      <p className="mt-1 truncate text-xs text-slate-500" title={model.fileName}>
        {model.fileName}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-slate-500">Size</dt>
          <dd className="mt-0.5 font-medium text-slate-300">{formatBytes(model.fileSize)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Uploaded</dt>
          <dd className="mt-0.5 font-medium text-slate-300">{formatDate(model.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex gap-2 border-t border-slate-800 pt-4">
        <Link to={`/viewer/${model.id}`} className="btn-primary btn-sm flex-1">
          Open
        </Link>
        <button type="button" className="btn-secondary btn-sm" onClick={() => onDelete(model)}>
          Delete
        </button>
      </div>
    </article>
  );
});

export default ModelCard;
