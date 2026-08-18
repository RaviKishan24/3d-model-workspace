import { useCallback, useEffect, useState } from 'react';
import modelService from '../services/modelService';
import { toFriendlyError } from '../services/api';

/** Paginated model list with loading / error / empty state handling. */
export function useModels({ limit = 12 } = {}) {
  const [models, setModels] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPage = useCallback(
    (targetPage, signal) => {
      setLoading(true);
      return modelService
        .list({ page: targetPage, limit }, signal ? { signal } : {})
        .then((data) => {
          setModels(data.models);
          setPagination(data.pagination);
          setError('');
        })
        .catch((err) => {
          if (err.code === 'ERR_CANCELED') return;
          setError(toFriendlyError(err).message);
        })
        .finally(() => setLoading(false));
    },
    [limit]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPage(page, controller.signal);
    return () => controller.abort();
  }, [page, fetchPage]);

  const refresh = useCallback(() => fetchPage(page), [fetchPage, page]);

  const removeLocal = useCallback((id) => {
    setModels((current) => current.filter((m) => m.id !== id));
    setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
  }, []);

  return {
    models,
    pagination,
    page,
    setPage,
    loading,
    error,
    refresh,
    removeLocal,
    isEmpty: !loading && !error && models.length === 0,
  };
}

export default useModels;
