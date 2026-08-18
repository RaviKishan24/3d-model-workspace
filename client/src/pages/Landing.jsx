import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import useAuth from "../hooks/useAuth";

const features = [
  {
    title: "Real-time 3D visualisation",
    body: "Inspect GLB, GLTF and OBJ assets in a Three.js viewer with orbit, zoom and pan controls, auto-centering and automatic camera fitting for any model scale.",
    icon: "◈",
  },
  {
    title: "Secure cloud storage",
    body: "Models are uploaded straight to Supabase Storage with short-lived presigned URLs. Only you can read or delete your own files.",
    icon: "⛁",
  },
  {
    title: "Saved camera states",
    body: "Capture any angle as a named view. Positions are stored in MongoDB, so your framing is still there after you log out and come back.",
    icon: "⦿",
  },
];

const steps = [
  "Create your account",
  "Upload a 3D model",
  "Frame the perfect angle",
  "Save the view and return anytime",
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary btn-sm">
                Open workspace
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(700px circle at 20% 0%, rgba(18,180,118,0.18), transparent 60%), radial-gradient(600px circle at 85% 20%, rgba(56,189,248,0.12), transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                MERN · Three.js · Supabase
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                A professional workspace for your 3D models
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                Upload models to secure cloud storage, explore them in the
                browser with full orbit controls, and save named camera views
                that persist across every session.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  className="btn-primary"
                >
                  Get Started
                </Link>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                {[
                  ["GLB / GLTF / OBJ", "Formats"],
                  ["Supabase Storage", "Delivery"],
                  ["Unlimited", "Saved views"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-200">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card animate-fade-up overflow-hidden p-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center gap-1.5 pb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-400/70" />
                  <span className="ml-3 text-xs text-slate-500">
                    viewer/turbine-assembly.glb
                  </span>
                </div>
                <div
                  className="relative flex aspect-[4/3] items-center justify-center rounded-md border border-slate-800"
                  style={{
                    background:
                      "conic-gradient(from 210deg at 50% 50%, #0b1220, #101a2b, #0b1220), radial-gradient(circle at 50% 45%, rgba(55,207,144,0.22), transparent 55%)",
                  }}
                >
                  <svg
                    viewBox="0 0 200 200"
                    className="h-3/4 w-3/4 text-brand-400"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      opacity="0.9"
                    >
                      <path d="M100 25l62 36v78l-62 36-62-36V61l62-36z" />
                      <path d="M38 61l62 36 62-36M100 97v78" opacity="0.55" />
                      <path d="M100 25v72l62 36" opacity="0.35" />
                      <circle cx="100" cy="97" r="4" fill="currentColor" />
                    </g>
                  </svg>
                  <span className="absolute bottom-3 left-3 rounded bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-400">
                    Orbit · Zoom · Pan
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Reset Camera", "Save View", "Auto Rotate", "Grid"].map(
                    (label) => (
                      <span
                        key={label}
                        className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800/80 bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Everything the workspace does
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Built as a full MERN stack application with a Three.js rendering
              layer and Supabase Storage for secure file delivery.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="card p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-lg text-brand-300">
                    {feature.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="card p-5">
                  <span className="text-xs font-bold text-brand-400">
                    STEP {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-medium text-slate-200">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} 3D Model Workspace — MERN, Three.js and
            Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
}
