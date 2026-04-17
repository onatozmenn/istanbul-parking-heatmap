interface HeaderProps {
  generated: string | null;
}

export function Header({ generated }: HeaderProps) {
  const freshness = generated
    ? new Date(generated).toLocaleDateString("tr-TR", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-[env(safe-area-inset-top,0px)] sm:px-5 sm:pt-0"
      role="banner"
    >
      <div className="translate-y-4 flex items-start justify-end gap-2 sm:translate-y-3 sm:items-center">
        <div className="pointer-events-auto rounded-2xl glass-panel px-7 py-4 sm:absolute sm:left-5 sm:top-3 sm:rounded-[9px] sm:px-8 sm:py-5" style={{ boxShadow: "none" }}>
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-white sm:text-[18px] sm:font-medium">
            İstanbul İspark Doluluk Isı Haritası
          </h1>
        </div>

        {freshness && (
          <div className="pointer-events-auto hidden rounded-[9px] glass-panel px-3.5 py-2 text-[11px] text-white/40 sm:block" style={{ boxShadow: 'none' }}>
            Son güncelleme <span className="font-medium text-white/60">{freshness}</span>
          </div>
        )}
      </div>
    </header>
  );
}
