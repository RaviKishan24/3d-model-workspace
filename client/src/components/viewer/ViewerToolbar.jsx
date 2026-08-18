const backgrounds = [
  { id: 'dark', label: 'Dark' },
  { id: 'slate', label: 'Slate' },
  { id: 'light', label: 'Light' },
];

function ToolButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={`btn btn-sm border ${
        active
          ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
          : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function ViewerToolbar({
  onReset,
  onSaveView,
  onToggleSavedViews,
  savedViewsOpen,
  savedViewsCount,
  autoRotate,
  onToggleAutoRotate,
  showGrid,
  onToggleGrid,
  wireframe,
  onToggleWireframe,
  background,
  onBackgroundChange,
  onToggleFullscreen,
  isFullscreen,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2.5 sm:px-4">
      <ToolButton onClick={onReset} disabled={disabled}>
        Reset Camera
      </ToolButton>
      <ToolButton onClick={onSaveView} disabled={disabled}>
        Save View
      </ToolButton>
      <ToolButton onClick={onToggleSavedViews} active={savedViewsOpen}>
        Saved Views{savedViewsCount ? ` (${savedViewsCount})` : ''}
      </ToolButton>

      <span className="mx-1 hidden h-5 w-px bg-slate-800 sm:block" />

      <ToolButton onClick={onToggleAutoRotate} active={autoRotate} disabled={disabled}>
        Auto Rotate
      </ToolButton>
      <ToolButton onClick={onToggleGrid} active={showGrid}>
        Grid
      </ToolButton>
      <ToolButton onClick={onToggleWireframe} active={wireframe} disabled={disabled}>
        Wireframe
      </ToolButton>

      <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
        <span className="hidden sm:inline">Background</span>
        <select
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-brand-400 focus:outline-none"
          value={background}
          onChange={(e) => onBackgroundChange(e.target.value)}
        >
          {backgrounds.map((bg) => (
            <option key={bg.id} value={bg.id}>
              {bg.label}
            </option>
          ))}
        </select>
      </label>

      <ToolButton onClick={onToggleFullscreen}>
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </ToolButton>
    </div>
  );
}
