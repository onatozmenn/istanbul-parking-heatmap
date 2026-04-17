import { occupancyToCss } from "../lib/colors";
import { deltaToCss } from "../lib/deltaColors";
import type { ColumnStyle } from "../layers/parkingColumnLayer";
import type { TransportMode } from "../types";

const STYLE_LABELS: Record<ColumnStyle, string> = {
  hexgrid: "Altıgen",
  columns: "Sütunlar",
  bars: "Sokak Çubukları",
};

const STYLE_ORDER: ColumnStyle[] = ["columns", "bars", "hexgrid"];

interface LegendProps {
  is3D?: boolean;
  comparing?: boolean;
  columnStyle?: ColumnStyle;
  onColumnStyleChange?: (style: ColumnStyle) => void;
  isochroneActive?: boolean;
  isochroneMode?: TransportMode;
}

export function Legend({ is3D, comparing, columnStyle, onColumnStyleChange, isochroneActive, isochroneMode }: LegendProps) {
  if (comparing) {
    return <DeltaLegend is3D={is3D} />;
  }

  if (isochroneActive && isochroneMode) {
    return <IsochroneLegend mode={isochroneMode} />;
  }

  // Generate gradient stops
  const stops = Array.from({ length: 20 }, (_, i) => {
    const occ = i / 19;
    return `${occupancyToCss(occ)} ${Math.round((i / 19) * 100)}%`;
  });

  return (
    <div className="absolute bottom-28 right-4 z-20 rounded-[9px] glass-panel px-4 py-3 panel-fade-up">
      <p className="text-[10px] text-white/30 mb-2 font-medium tracking-widest uppercase">
        Doluluk
      </p>
      <div
        className="h-2 w-40 rounded-[9px]"
        style={{
          background: `linear-gradient(to right, ${stops.join(", ")})`,
        }}
      />
      <div className="flex justify-between mt-1.5 text-[10px] text-white/25 tabular-nums">
        <span>0%</span>
        <span>60%</span>
        <span>80%</span>
        <span>100%</span>
      </div>
      <div className="flex justify-between mt-0.5 text-[9px] font-medium">
        <span className="text-green-400/80">Müsait</span>
        <span className="text-yellow-400/80">Orta</span>
        <span className="text-red-400/80">Zor</span>
      </div>

      {/* 3D height explanation */}
      {is3D && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[9px] bg-white/20" style={{
              clipPath: "polygon(20% 100%, 80% 100%, 65% 30%, 35% 30%)",
            }} />
            <span className="text-[9px] text-white/30">Yükseklik = doluluk seviyesi</span>
          </div>
        </div>
      )}

      {/* 3D style toggle */}
      {is3D && columnStyle && onColumnStyleChange && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.05]">
          <p className="text-[9px] text-white/20 mb-1.5">3B Stil</p>
          <div className="flex gap-1">
            {STYLE_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => onColumnStyleChange(s)}
                className={`px-2 py-1 rounded-[9px] text-[9px] transition-all duration-200 ${
                  columnStyle === s
                    ? "bg-white/12 text-white/80 font-medium"
                    : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
                }`}
              >
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Non-enforced / pressure legend */}
      <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-2 rounded-[9px]" style={{ backgroundColor: "rgba(59, 130, 246, 0.5)" }} />
          <span className="text-[9px] text-white/30">Ücretsiz Park (sayaçlar kapalı)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-2 rounded-[9px]"
            style={{
              background: "linear-gradient(to right, rgba(34,197,94,0.5), rgba(234,179,8,0.5), rgba(239,68,68,0.5))",
            }}
          />
          <span className="text-[9px] text-white/30">Şikayetlerden tahmin</span>
        </div>
      </div>
    </div>
  );
}

function DeltaLegend({ is3D }: { is3D?: boolean }) {
  const stops = Array.from({ length: 11 }, (_, i) => {
    const delta = (i - 5) * 0.06; // -0.30 to +0.30
    return `${deltaToCss(delta, true)} ${Math.round((i / 10) * 100)}%`;
  });

  return (
    <div className="absolute bottom-28 right-4 z-20 rounded-[9px] glass-panel px-4 py-3 panel-fade-up" style={{ borderColor: "rgba(168, 85, 247, 0.15)" }}>
      <p className="text-[10px] text-purple-300/80 mb-2 font-medium tracking-widest uppercase">
        Karşılaştırma
      </p>
      <div
        className="h-2 w-40 rounded-[9px]"
        style={{
          background: `linear-gradient(to right, ${stops.join(", ")})`,
        }}
      />
      <div className="flex justify-between mt-1.5 text-[10px] text-white/25 tabular-nums">
        <span>-30%</span>
        <span>0</span>
        <span>+30%</span>
      </div>
      <div className="flex justify-between mt-0.5 text-[9px] font-medium">
        <span className="text-blue-400/80">Daha boş</span>
        <span className="text-white/25">Aynı</span>
        <span className="text-red-400/80">Daha dolu</span>
      </div>
      {is3D && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-[9px] bg-white/20" style={{
              clipPath: "polygon(20% 100%, 80% 100%, 65% 30%, 35% 30%)",
            }} />
            <span className="text-[9px] text-white/30">Yükseklik = değişim miktarı</span>
          </div>
        </div>
      )}
    </div>
  );
}

import { legendGradientCss, modeAccentCss } from "../lib/isochroneColors";

const ISO_MODE_LABELS: Record<TransportMode, string> = {
  driving: "Araç",
  cycling: "Bisiklet",
  walking: "Yürüyüş",
};

function IsochroneLegend({ mode }: { mode: TransportMode }) {
  const label = ISO_MODE_LABELS[mode];
  const accent = modeAccentCss(mode);
  const gradient = legendGradientCss(mode);

  return (
    <div className="absolute bottom-28 right-4 z-20 rounded-[9px] glass-panel px-4 py-3 panel-fade-up">
      <p
        className="text-[10px] mb-2 font-medium tracking-widest uppercase"
        style={{ color: accent, opacity: 0.8 }}
      >
        {label} Isochrone
      </p>

      {/* Smooth gradient bar matching the map visualization */}
      <div
        className="h-2 w-40 rounded-[9px]"
        style={{ background: gradient }}
      />
      <div className="flex justify-between mt-1.5 text-[10px] text-white/25 tabular-nums">
        <span>2 min</span>
        <span>10</span>
        <span>20</span>
      </div>
      <div className="flex justify-between mt-0.5 text-[9px] font-medium">
        <span style={{ color: accent, opacity: 0.8 }}>Yakın</span>
        <span className="text-white/25">Ulaşılabilir</span>
        <span className="text-white/15">Uzak</span>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-[9px]"
            style={{ backgroundColor: accent }}
          />
          <span className="text-[9px] text-white/30">Başlangıç noktası</span>
        </div>
        <p className="text-[9px] text-white/20 mt-1">
          Yoğun saatlerde halkalar daralır
        </p>
      </div>
    </div>
  );
}




