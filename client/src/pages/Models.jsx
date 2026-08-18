import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import ModelGrid from '../components/ModelGrid.jsx';
import UploadModal from '../components/UploadModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import useModels from '../hooks/useModels';
import { useToast } from '../context/ToastContext.jsx';
import modelService from '../services/modelService';
import { toFriendlyError } from '../services/api';

export default function Models() {
  const toast = useToast();
  const { models, pagination, page, setPage, loading, error, refresh, removeLocal, isEmpty } =
    useModels({ limit: 9 });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await modelService.remove(pendingDelete.id);
      removeLocal(pendingDelete.id);
      toast.success('Model deleted');
      setPendingDelete(null);
    } catch (err) {
      toast.error(toFriendlyError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Models</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {pagination.total} model{pagination.total === 1 ? '' : 's'} in your workspace
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setUploadOpen(true)}>
            Upload 3D Model
          </button>
        </div>

        <section className="mt-8">
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

        {pagination.pages > 1 ? (
          <nav className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </nav>
        ) : null}
      </main>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refresh} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this model?"
        description={`"${pendingDelete?.name}" and all of its saved views will be permanently removed.`}
        confirmLabel="Delete model"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
