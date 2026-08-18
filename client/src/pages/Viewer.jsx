import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Spinner from '../components/Spinner.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ViewerToolbar from '../components/viewer/ViewerToolbar.jsx';
import SavedViewsPanel from '../components/viewer/SavedViewsPanel.jsx';
import SaveViewDialog from '../components/viewer/SaveViewDialog.jsx';
import useModelObject from '../components/viewer/useModelObject.js';
import useSavedViews from '../hooks/useSavedViews';
import { useToast } from '../context/ToastContext.jsx';
import modelService from '../services/modelService';
import { toFriendlyError } from '../services/api';
import { formatBytes } from '../utils/fileValidation';

// three + fiber + drei only download once a model is actually opened.
const ModelScene = lazy(() => import('../components/viewer/ModelScene.jsx'));

export default function Viewer() {
  const { modelId } = useParams();
  const toast = useToast();

  const sceneRef = useRef(null);
  const containerRef = useRef(null);

  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelError, setModelError] = useState('');

  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [background, setBackground] = useState('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeViewId, setActiveViewId] = useState(null);

  const {
    views,
    loading: viewsLoading,
    error: viewsError,
    refresh: refreshViews,
    create: createView,
    remove: removeView,
  } = useSavedViews(modelId);

  // Fetch metadata + a short-lived presigned download URL.
  const fetchModel = useCallback(
    (signal) => {
      setLoadingModel(true);
      return modelService
        .get(modelId, signal ? { signal } : {})
        .then((data) => {
          setModel(data);
          setModelError('');
        })
        .catch((err) => {
          if (err.code === 'ERR_CANCELED') return;
          setModelError(toFriendlyError(err).message);
        })
        .finally(() => setLoadingModel(false));
    },
    [modelId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchModel(controller.signal);
    return () => controller.abort();
  }, [fetchModel]);

  const {
    object,
    progress,
    error: geometryError,
  } = useModelObject(model?.downloadUrl, model?.fileType);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const handleSaveView = async (name) => {
    const snapshot = sceneRef.current?.capture();
    if (!snapshot) return;

    setSaving(true);
    try {
      const view = await createView({ name, ...snapshot });
      setActiveViewId(view.id);
      setSaveOpen(false);
      setPanelOpen(true);
      toast.success(`View "${view.name}" saved`);
    } catch (err) {
      const friendly = toFriendlyError(err);
      toast.error(
        friendly.status === 409 ? 'A view with that name already exists' : friendly.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLoadView = (view) => {
    sceneRef.current?.restore(view, { animate: true });
    setActiveViewId(view.id);
    setAutoRotate(false);
    toast.info(`Restored "${view.name}"`);
  };

  const confirmDeleteView = async () => {
    setDeleting(true);
    try {
      await removeView(pendingDelete.id);
      if (activeViewId === pendingDelete.id) setActiveViewId(null);
      toast.success('View deleted');
      setPendingDelete(null);
    } catch (err) {
      toast.error(toFriendlyError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const ready = Boolean(object);
  const loadError = modelError || geometryError;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300">
              ← Back to dashboard
            </Link>
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
              {model?.name || 'Loading model…'}
            </h1>
            {model ? (
              <p className="mt-0.5 text-xs text-slate-500">
                {model.fileName} · {model.fileType.toUpperCase()} · {formatBytes(model.fileSize)}
              </p>
            ) : null}
          </div>
        </div>

        <div
          ref={containerRef}
          className="card mt-4 flex flex-1 flex-col overflow-hidden bg-slate-950"
        >
          <ViewerToolbar
            onReset={() => {
              sceneRef.current?.reset();
              setActiveViewId(null);
            }}
            onSaveView={() => setSaveOpen(true)}
            onToggleSavedViews={() => setPanelOpen((v) => !v)}
            savedViewsOpen={panelOpen}
            savedViewsCount={views.length}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            wireframe={wireframe}
            onToggleWireframe={() => setWireframe((v) => !v)}
            background={background}
            onBackgroundChange={setBackground}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            disabled={!ready}
          />

          <div className="flex flex-1 flex-col lg:flex-row">
            <div className="relative min-h-[55vh] flex-1 lg:min-h-[70vh]">
              {loadError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="max-w-sm text-sm text-red-300">{loadError}</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary" onClick={() => fetchModel()}>
                      Try again
                    </button>
                    <Link to="/dashboard" className="btn-ghost">
                      Back to dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <Spinner className="h-8 w-8" label="Loading 3D engine…" />
                      </div>
                    }
                  >
                    {model ? (
                      <ModelScene
                        ref={sceneRef}
                        object={object}
                        autoRotate={autoRotate}
                        wireframe={wireframe}
                        showGrid={showGrid}
                        background={background}
                      />
                    ) : null}
                  </Suspense>

                  {!ready ? (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70">
                      <Spinner className="h-8 w-8" />
                      <p className="text-sm text-slate-300">
                        {loadingModel ? 'Fetching model…' : `Loading geometry… ${progress}%`}
                      </p>
                    </div>
                  ) : null}

                  {ready ? (
                    <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-400">
                      Drag to rotate · Scroll or pinch to zoom · Right-drag or two fingers to pan
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {panelOpen ? (
              <div className="border-t border-slate-800 lg:border-t-0">
                <SavedViewsPanel
                  views={views}
                  loading={viewsLoading}
                  error={viewsError}
                  activeViewId={activeViewId}
                  onLoad={handleLoadView}
                  onDelete={setPendingDelete}
                  onRetry={refreshViews}
                  onClose={() => setPanelOpen(false)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <SaveViewDialog
        open={saveOpen}
        busy={saving}
        onSave={handleSaveView}
        onCancel={() => setSaveOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this saved view?"
        description={`"${pendingDelete?.name}" will be removed from your account.`}
        confirmLabel="Delete view"
        busy={deleting}
        onConfirm={confirmDeleteView}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
