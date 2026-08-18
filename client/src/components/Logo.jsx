export default function Logo({ withText = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0b1220" stroke="#1e293b" />
        <path
          d="M16 5l9 5.2v10.6L16 26 7 20.8V10.2L16 5z"
          fill="none"
          stroke="#37cf90"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M7 10.2l9 5.2 9-5.2M16 15.4V26"
          fill="none"
          stroke="#37cf90"
          strokeWidth="1.4"
          opacity="0.65"
        />
      </svg>
      {withText ? (
        <span className="text-base font-bold tracking-tight text-white">3D Model Workspace</span>
      ) : null}
    </span>
  );
}
