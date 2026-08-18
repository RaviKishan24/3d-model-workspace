export default function Spinner({ className = 'h-5 w-5', label }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <svg className={`animate-spin text-brand-400 ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="text-sm text-slate-400">{label}</span> : null}
    </span>
  );
}
