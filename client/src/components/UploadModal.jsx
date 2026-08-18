import { useRef, useState } from 'react';
import Spinner from './Spinner.jsx';
import { useToast } from '../context/ToastContext.jsx';
import modelService from '../services/modelService';
import { toFriendlyError } from '../services/api';
import {
  formatBytes,
  MAX_UPLOAD_BYTES,
  resolveContentType,
  validateModelFile,
} from '../utils/fileValidation';

/**
 * Three-step upload:
 *   1. ask the API for a presigned Supabase upload URL
 *   2. PUT the file directly to Supabase Storage (no bytes through the API)
 *   3. register the metadata in MongoDB
 */
export default function UploadModal({ open, onClose, onUploaded }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [fileError, setFileError] = useState('');
  const [stage, setStage] = useState('idle'); // idle | signing | uploading | saving
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const busy = stage !== 'idle';

  const reset = () => {
    setFile(null);
    setName('');
    setFileError('');
    setStage('idle');
    setProgress(0);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const selectFile = (selected) => {
    if (!selected) return;
    const error = validateModelFile(selected);
    setFileError(error || '');
    setFile(error ? null : selected);
    if (!error && !name) setName(selected.name.replace(/\.[^.]+$/, ''));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!file) return setFileError('Choose a .glb, .gltf or .obj file');
    if (!name.trim()) return setFileError('Give this model a name');

    const contentType = resolveContentType(file);

    try {
      setStage('signing');
      const presigned = await modelService.requestPresignedUrl({
        fileName: file.name,
        contentType,
        fileSize: file.size,
      });

      setStage('uploading');
      setProgress(0);
      await modelService.uploadToStorage({   // renamed from uploadToS3
        uploadUrl: presigned.uploadUrl,
        file,
        contentType: presigned.contentType || contentType,
        onProgress: setProgress,
      });

      setStage('saving');
      const model = await modelService.register({
        name: name.trim(),
        fileName: file.name,
        storagePath: presigned.storagePath,   // was s3Key
        fileSize: file.size,                  // now required
      });

      toast.success(`"${model.name}" uploaded`);
      reset();
      onUploaded(model);
      onClose();
    } catch (err) {
      setStage('idle');
      setProgress(0);
      const friendly = toFriendlyError(err);
      // Remove S3-specific hint – Supabase errors are handled generically
      toast.error(friendly.message);
    }
  };

  if (!open) return null;

  const stageLabel = {
    signing: 'Preparing secure upload…',
    uploading: `Uploading to cloud storage… ${progress}%`,
    saving: 'Saving model details…',
  }[stage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div role="dialog" aria-modal="true" className="card w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload 3D model</h2>
            <p className="mt-1 text-sm text-slate-400">
              GLB, GLTF or OBJ · up to {formatBytes(MAX_UPLOAD_BYTES)}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="btn-ghost btn-sm"
            disabled={busy}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              selectFile(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragging ? 'border-brand-400 bg-brand-500/5' : 'border-slate-700 bg-slate-950/40'
            }`}
          >
            <input
              ref={inputRef}
              id="model-file"
              type="file"
              accept=".glb,.gltf,.obj"
              className="sr-only"
              onChange={(e) => selectFile(e.target.files?.[0])}
              disabled={busy}
            />
            <p className="text-sm text-slate-300">
              {file ? file.name : 'Drag a model here, or'}{' '}
              {!file ? (
                <label
                  htmlFor="model-file"
                  className="cursor-pointer font-semibold text-brand-400 hover:text-brand-300"
                >
                  browse files
                </label>
              ) : null}
            </p>
            {file ? (
              <p className="mt-1 text-xs text-slate-500">{formatBytes(file.size)}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                GLB is recommended for the fastest loading
              </p>
            )}
            {file && !busy ? (
              <button
                type="button"
                className="btn-ghost btn-sm mt-3"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                Choose another file
              </button>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="model-name">
              Model name
            </label>
            <input
              id="model-name"
              className="input"
              placeholder="Turbine assembly"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          {fileError ? <p className="field-error">{fileError}</p> : null}

          {busy ? (
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Spinner className="h-4 w-4" />
                {stageLabel}
              </div>
              {stage === 'uploading' ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button type="button" className="btn-secondary" onClick={close} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !file}>
              Upload model
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}