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
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none" role="banner">
      <div className="pointer-events-auto flex items-center gap-3 rounded-[9px] glass-panel px-5 py-3">
        <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <MapPin size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-medium tracking-tight leading-tight">
            İstanbul Park <span className="text-white/40">Isı Haritası</span>
          </h1>
          <p className="text-[11px] text-white/30 mt-0.5">
            {blockCount > 0 && `${blockCount.toLocaleString()} blok`}
            {dateRange && ` · ${dateRange.from} – ${dateRange.to}`}
          </p>
        </div>
      </div>

      {freshness && (
        <div className="pointer-events-auto rounded-[9px] glass-panel px-3.5 py-2 text-[11px] text-white/40">
          Son güncelleme <span className="text-white/60 font-medium">{freshness}</span>
        </div>
      )}
    </header>
  );
}




