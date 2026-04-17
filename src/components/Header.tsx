import { MapPin } from "lucide-react";

interface HeaderProps {
  generated: string | null;
  dateRange: { from: string; to: string } | null;
  blockCount: number;
}

export function Header({ generated, dateRange, blockCount }: HeaderProps) {
  const freshness = generated
    ? new Date(generated).toLocaleDateString("tr-TR", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 pointer-events-none" role="banner">
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 rounded-[9px] glass-panel px-3 sm:px-5 py-2 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[9px] bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <MapPin size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-[13px] sm:text-[15px] font-medium tracking-tight leading-tight">
            İstanbul Park <span className="text-white/40 hidden sm:inline">Isı Haritası</span>
          </h1>
          <p className="text-[10px] sm:text-[11px] text-white/30 mt-0.5 hidden sm:block">
            {blockCount > 0 && `${blockCount.toLocaleString()} blok`}
            {dateRange && ` · ${dateRange.from} – ${dateRange.to}`}
          </p>
        </div>
      </div>

      {freshness && (
        <div className="pointer-events-auto rounded-[9px] glass-panel px-3.5 py-2 text-[11px] text-white/40 hidden sm:block">
          Son güncelleme <span className="text-white/60 font-medium">{freshness}</span>
        </div>
      )}
    </header>
  );
}




