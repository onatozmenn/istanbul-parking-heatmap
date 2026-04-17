import { occupancyToCss } from "../lib/colors";
import { deltaToCss } from "../lib/deltaColors";
import { dayName, formatHour, formatOccupancy } from "../lib/format";
import { legendGradientCss, modeAccentCss } from "../lib/isochroneColors";
import type { ColumnStyle } from "../layers/parkingColumnLayer";
import type { TimeSlot, TransportMode } from "../types";

const STYLE_LABELS: Record<ColumnStyle, string> = {
  hexgrid: "Alt\u0131gen",
  columns: "S\u00FCtun",
  bars: "\u00C7ubuk",
};

const STYLE_ORDER: ColumnStyle[] = ["columns", "bars", "hexgrid"];

interface MobileInsightsPanelProps {
  cityAverages: Float32Array;
  cityEnforcedFraction: Float32Array;
  timeSlot: TimeSlot;
  onCellClick: (dow: number, hour: number) => void;
  comparing?: boolean;
  is3D?: boolean;
  columnStyle?: ColumnStyle;
  onColumnStyleChange?: (style: ColumnStyle) => void;
  isochroneActive?: boolean;
  isochroneMode?: TransportMode;
}

export function MobileInsightsPanel({
  cityAverages,
  cityEnforcedFraction,
  timeSlot,
  onCellClick,
  comparing,
  is3D,
  columnStyle,
  onColumnStyleChange,
  isochroneActive,
  isochroneMode,
}: MobileInsightsPanelProps) {
  const selectedIndex = timeSlot.dow * 24 + timeSlot.hour;
  const selectedAverage = cityAverages[selectedIndex] ?? 0;
  const selectedEnforcedFraction = cityEnforcedFraction[selectedIndex] ?? 0;
  const mostlyNotEnforced = selectedEnforcedFraction < 0.5;

  const regularStops = Array.from({ length: 20 }, (_, i) => {
    const occ = i / 19;
    return `${occupancyToCss(occ)} ${Math.round((i / 19) * 100)}%`;
  });

  const deltaStops = Array.from({ length: 11 }, (_, i) => {
    const delta = (i - 5) * 0.06;
    return `${deltaToCss(delta, true)} ${Math.round((i / 10) * 100)}%`;
  });

  const accent = isochroneActive && isochroneMode ? modeAccentCss(isochroneMode) : occupancyToCss(selectedAverage);

  const legend = comparing
    ? {
        title: "Kar\u015F\u0131la\u015Ft\u0131rma",
        gradient: `linear-gradient(to right, ${deltaStops.join(", ")})`,
        labels: ["-30%", "0", "+30%"],
      }
    : isochroneActive && isochroneMode
      ? {
          title: "Ula\u015F\u0131m halkalar\u0131",
          gradient: legendGradientCss(isochroneMode),
          labels: ["2 dk", "10", "20"],
        }
      : {
          title: "Doluluk",
          gradient: `linear-gradient(to right, ${regularStops.join(", ")})`,
          labels: ["0%", "60%", "80%", "100%"],
        };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/[0.28]">
            {legend.title}
          </p>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-white/[0.28]">{"Se\u00E7ili saat"}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: accent }}>
              {formatOccupancy(selectedAverage, !mostlyNotEnforced)}
            </p>
          </div>
        </div>

        <div className="mt-3 h-2.5 rounded-full" style={{ background: legend.gradient }} />

        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/[0.28]">
          {legend.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {is3D && columnStyle && onColumnStyleChange && !comparing && !isochroneActive && (
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/[0.24]">{"3B g\u00F6r\u00FCn\u00FCm"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STYLE_ORDER.map((style) => (
                <button
                  key={style}
                  onClick={() => onColumnStyleChange(style)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    columnStyle === style
                      ? "bg-white text-gray-950"
                      : "bg-white/[0.04] text-white/[0.55]"
                  }`}
                >
                  {STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/[0.28]">
            {"Haftal\u0131k g\u00F6r\u00FCn\u00FCm"}
          </p>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-white/[0.28]">{dayName(timeSlot.dow)}</p>
            <p className="mt-1 text-xs font-medium tabular-nums text-white/[0.72]">
              {formatHour(timeSlot.hour)}
            </p>
          </div>
        </div>

        <div className="hide-scrollbar mt-3 overflow-x-auto">
          <div className="inline-flex min-w-max gap-[2px]">
            <div className="mr-1.5 flex flex-col gap-[2px] pt-4">
              {Array.from({ length: 7 }, (_, dow) => (
                <div key={dow} className="flex h-[11px] items-center text-[8px] font-medium text-white/25">
                  {dayName(dow)}
                </div>
              ))}
            </div>

            <div className="flex gap-[2px]">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex flex-col gap-[2px]">
                  <div className="h-3 text-center text-[7px] font-medium leading-none text-white/20">
                    {hour % 6 === 0 ? formatHour(hour).replace(":00", "") : ""}
                  </div>

                  {Array.from({ length: 7 }, (_, dow) => {
                    const index = dow * 24 + hour;
                    const value = cityAverages[index];
                    const enforcedFraction = cityEnforcedFraction[index];
                    const cellMostlyNotEnforced = enforcedFraction < 0.5;
                    const isSelected = dow === timeSlot.dow && hour === timeSlot.hour;

                    return (
                      <button
                        key={dow}
                        onClick={() => onCellClick(dow, hour)}
                        className="h-[11px] w-[11px] rounded-[4px] transition-transform active:scale-95"
                        style={{
                          backgroundColor:
                            cellMostlyNotEnforced && value <= 0
                              ? "rgba(59, 130, 246, 0.34)"
                              : value > 0
                                ? occupancyToCss(value, !cellMostlyNotEnforced)
                                : "rgba(255,255,255,0.05)",
                          opacity: value > 0 || cellMostlyNotEnforced ? 0.92 : 0.34,
                          outline: isSelected ? "1px solid rgba(255,255,255,0.92)" : "none",
                          outlineOffset: "-1px",
                        }}
                        aria-label={`${dayName(dow)} ${formatHour(hour)} ${formatOccupancy(value, !cellMostlyNotEnforced)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          <div>
            <p className="text-[10px] text-white/[0.28]">{"\u015Eehir ortalamas\u0131"}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: occupancyToCss(selectedAverage, !mostlyNotEnforced) }}>
              {formatOccupancy(selectedAverage, !mostlyNotEnforced)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-white/[0.28]">{"Saya\u00E7 aktifli\u011Fi"}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-white/75">
              %{Math.round(selectedEnforcedFraction * 100)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
