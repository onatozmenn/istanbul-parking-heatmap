import { occupancyToCss } from "../lib/colors";
import { deltaToCss } from "../lib/deltaColors";
import { contourFillColor, modeAccentCss } from "../lib/isochroneColors";
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

function rgbaToCss(color: [number, number, number, number]) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255).toFixed(2)})`;
}

function SwatchBar({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-2.5 w-52 overflow-hidden rounded-[9px]">
      {colors.map((color, index) => (
        <span key={`${color}-${index}`} className="h-full flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

export function Legend({
  is3D,
  comparing,
  columnStyle,
  onColumnStyleChange,
  isochroneActive,
  isochroneMode,
}: LegendProps) {
  if (comparing) {
    return <DeltaLegend is3D={is3D} />;
  }

  if (isochroneActive && isochroneMode) {
    return <IsochroneLegend mode={isochroneMode} />;
  }

  const colors = Array.from({ length: 12 }, (_, i) => occupancyToCss(i / 11));

  return (
    <div
      className="absolute bottom-6 right-5 z-20 rounded-[9px] glass-panel px-5 py-4 panel-fade-up hide-on-mobile"
      style={{ boxShadow: "none" }}
    >
      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-white/30">
        Doluluk
      </p>

      <SwatchBar colors={colors} />

      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/25">
        <span>0%</span>
        <span>60%</span>
        <span>80%</span>
        <span>100%</span>
      </div>

      <div className="mt-1 flex justify-between text-[10px] font-medium">
        <span className="text-green-400/80">Müsait</span>
        <span className="text-yellow-400/80">Orta</span>
        <span className="text-red-400/80">Zor</span>
      </div>

      {is3D && (
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-[9px] bg-white/20"
              style={{ clipPath: "polygon(20% 100%, 80% 100%, 65% 30%, 35% 30%)" }}
            />
            <span className="text-[10px] text-white/30">Yükseklik = doluluk seviyesi</span>
          </div>
        </div>
      )}

      {is3D && columnStyle && onColumnStyleChange && (
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <p className="mb-1.5 text-[10px] text-white/20">3B Stil</p>
          <div className="flex gap-1">
            {STYLE_ORDER.map((style) => (
              <button
                key={style}
                onClick={() => onColumnStyleChange(style)}
                className={`rounded-[9px] px-2.5 py-1 text-[10px] transition-all duration-200 ${
                  columnStyle === style
                    ? "bg-white/12 font-medium text-white/80"
                    : "text-white/25 hover:bg-white/[0.04] hover:text-white/50"
                }`}
              >
                {STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2 border-t border-white/[0.05] pt-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-3.5 rounded-[9px]" style={{ backgroundColor: "rgba(59, 130, 246, 0.5)" }} />
          <span className="text-[10px] text-white/30">Ücretsiz Park (sayaçlar kapalı)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <span className="h-2.5 w-2 rounded-[9px] bg-green-500/60" />
            <span className="h-2.5 w-2 rounded-[9px] bg-yellow-400/60" />
            <span className="h-2.5 w-2 rounded-[9px] bg-red-500/60" />
          </div>
          <span className="text-[10px] text-white/30">Şikayetlerden tahmin</span>
        </div>
      </div>
    </div>
  );
}

function DeltaLegend({ is3D }: { is3D?: boolean }) {
  const colors = Array.from({ length: 11 }, (_, i) => {
    const delta = (i - 5) * 0.06;
    return deltaToCss(delta, true);
  });

  return (
    <div
      className="absolute bottom-6 right-5 z-20 rounded-[9px] glass-panel px-5 py-4 panel-fade-up hide-on-mobile"
      style={{ borderColor: "rgba(168, 85, 247, 0.15)", boxShadow: "none" }}
    >
      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-purple-300/80">
        Karşılaştırma
      </p>

      <SwatchBar colors={colors} />

      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/25">
        <span>-30%</span>
        <span>0</span>
        <span>+30%</span>
      </div>

      <div className="mt-1 flex justify-between text-[10px] font-medium">
        <span className="text-blue-400/80">Daha boş</span>
        <span className="text-white/25">Aynı</span>
        <span className="text-red-400/80">Daha dolu</span>
      </div>

      {is3D && (
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-[9px] bg-white/20"
              style={{ clipPath: "polygon(20% 100%, 80% 100%, 65% 30%, 35% 30%)" }}
            />
            <span className="text-[10px] text-white/30">Yükseklik = değişim miktarı</span>
          </div>
        </div>
      )}
    </div>
  );
}

const ISO_MODE_LABELS: Record<TransportMode, string> = {
  driving: "Araç",
  cycling: "Bisiklet",
  walking: "Yürüyüş",
};

function IsochroneLegend({ mode }: { mode: TransportMode }) {
  const label = ISO_MODE_LABELS[mode];
  const accent = modeAccentCss(mode);
  const colors = Array.from({ length: 10 }, (_, i) => rgbaToCss(contourFillColor(mode, i)));

  return (
    <div
      className="absolute bottom-6 right-5 z-20 rounded-[9px] glass-panel px-5 py-4 panel-fade-up hide-on-mobile"
      style={{ boxShadow: "none" }}
    >
      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest" style={{ color: accent, opacity: 0.8 }}>
        {label} İzokron
      </p>

      <SwatchBar colors={colors} />

      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/25">
        <span>2 dk</span>
        <span>10</span>
        <span>20</span>
      </div>

      <div className="mt-1 flex justify-between text-[10px] font-medium">
        <span style={{ color: accent, opacity: 0.8 }}>Yakın</span>
        <span className="text-white/25">Ulaşılabilir</span>
        <span className="text-white/15">Uzak</span>
      </div>

      <div className="mt-3 border-t border-white/[0.05] pt-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-[9px]" style={{ backgroundColor: accent }} />
          <span className="text-[10px] text-white/30">Başlangıç noktası</span>
        </div>
        <p className="mt-1 text-[10px] text-white/20">Yoğun saatlerde halkalar daralır</p>
      </div>
    </div>
  );
}
