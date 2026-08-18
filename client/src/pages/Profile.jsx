import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Spinner from "../components/Spinner.jsx";
import useAuth from "../hooks/useAuth";
import { useToast } from "../context/ToastContext.jsx";
import modelService from "../services/modelService";
import { toFriendlyError } from "../services/api";
import { formatBytes, formatDate } from "../utils/fileValidation";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    modelService
      .list({ page: 1, limit: 50 }, { signal: controller.signal })
      .then((data) => {
        const totalBytes = data.models.reduce(
          (sum, m) => sum + (m.fileSize || 0),
          0,
        );
        setStats({ count: data.pagination.total, totalBytes });
        setError("");
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED") return;
        setError(toFriendlyError(err).message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("You have been signed out");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your account and workspace usage.
        </p>

        <section className="card mt-6 p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Name
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">
                {user?.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">
                {user?.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Member since
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">
                {formatDate(user?.createdAt)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card mt-5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Usage
          </h2>
          {loading ? (
            <Spinner label="Loading usage…" />
          ) : error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : stats ? ( // 👈 added safety check
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Models stored
                </dt>
                <dd className="mt-1 text-2xl font-bold text-white">
                  {stats.count}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Storage used
                </dt>
                <dd className="mt-1 text-2xl font-bold text-white">
                  {formatBytes(stats.totalBytes)}
                </dd>
              </div>
            </dl>
          ) : null}
        </section>

        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={handleLogout}
        >
          Logout
        </button>
      </main>
    </div>
  );
}
