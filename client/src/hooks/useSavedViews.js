import { useCallback, useEffect, useState } from 'react';
import { viewService } from '../services/modelService';
import { toFriendlyError } from '../services/api';

/** CRUD for the camera states of one model. */
export function useSavedViews(modelId) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    (signal) => {
      if (!modelId) return Promise.resolve();
      setLoading(true);
      return viewService
        .list(modelId, signal ? { signal } : {})
        .then((data) => {
          setViews(data);
          setError('');
        })
        .catch((err) => {
          if (err.code === 'ERR_CANCELED') return;
          setError(toFriendlyError(err).message);
        })
        .finally(() => setLoading(false));
    },
    [modelId]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const create = useCallback(
    async (payload) => {
      const view = await viewService.create(modelId, payload);
      setViews((current) => [...current, view]);
      return view;
    },
    [modelId]
  );

  const remove = useCallback(
    async (viewId) => {
      await viewService.remove(modelId, viewId);
      setViews((current) => current.filter((v) => v.id !== viewId));
    },
    [modelId]
  );

  return { views, loading, error, refresh: () => load(), create, remove };
}

export default useSavedViews;
