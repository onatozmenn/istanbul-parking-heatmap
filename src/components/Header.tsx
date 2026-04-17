import { MapPin } from "lucide-react";

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
      className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:px-4 sm:pt-3"
      role="banner"
    >
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3 rounded-2xl glass-panel px-3.5 py-2.5 sm:rounded-[9px] sm:px-5 sm:py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_10px_24px_rgba(56,189,248,0.28)] sm:h-8 sm:w-8 sm:rounded-[9px] sm:shadow-none">
            <MapPin size={16} className="text-white" />
          </div>

          <h1 className="truncate text-[13px] font-semibold tracking-tight text-white sm:text-[15px] sm:font-medium">
            İstanbul Park <span className="hidden text-white/40 sm:inline">Isı Haritası</span>
          </h1>
        </div>

        {freshness && (
          <div className="pointer-events-auto hidden rounded-[9px] glass-panel px-3.5 py-2 text-[11px] text-white/40 sm:block">
            Son güncelleme <span className="font-medium text-white/60">{freshness}</span>
          </div>
        )}
      </div>
    </header>
  );
}
