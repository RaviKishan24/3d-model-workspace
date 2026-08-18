import { useCallback, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import ModelGrid from '../components/ModelGrid.jsx';
import UploadModal from '../components/UploadModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import useAuth from '../hooks/useAuth';
import useModels from '../hooks/useModels';
import { useToast } from '../context/ToastContext.jsx';
import modelService from '../services/modelService';
import { toFriendlyError } from '../services/api';
import { formatBytes } from '../utils/fileValidation';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { models, pagination, loading, error, refresh, removeLocal, isEmpty } = useModels({
    limit: 12,
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleUploaded = useCallback(() => refresh(), [refresh]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await modelService.remove(pendingDelete.id);
      removeLocal(pendingDelete.id);
      toast.success(`"${pendingDelete.name}" deleted`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(toFriendlyError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const storageUsed = models.reduce((sum, m) => sum + (m.fileSize || 0), 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Upload, inspect and save camera views for your 3D assets.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setUploadOpen(true)}>
            Upload 3D Model
          </button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Models', pagination.total],
            ['On this page', models.length],
            ['Storage (page)', formatBytes(storageUsed)],
          ].map(([label, value]) => (
            <div key={label} className="card p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            My Models
          </h2>
          <ModelGrid
            models={models}
            loading={loading}
            error={error}
            isEmpty={isEmpty}
            onDelete={setPendingDelete}
            onRetry={refresh}
            onUploadClick={() => setUploadOpen(true)}
          />
        </section>
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this model?"
        description={`"${pendingDelete?.name}" and all of its saved views will be permanently removed from cloud storage.`}
        confirmLabel="Delete model"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
