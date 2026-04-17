import { occupancyToCss } from "../lib/colors";
import { dayName, formatHour, formatOccupancy } from "../lib/format";
import type { TimeSlot } from "../types";

interface WeekHeatmapProps {
  cityAverages: Float32Array;
  cityEnforcedFraction: Float32Array;
  timeSlot: TimeSlot;
  onCellClick: (dow: number, hour: number) => void;
}

export function WeekHeatmap({ cityAverages, cityEnforcedFraction, timeSlot, onCellClick }: WeekHeatmapProps) {
  const averages = cityAverages;

  return (
    <div className="absolute bottom-28 left-4 z-20 rounded-[9px] glass-panel p-4 hide-on-mobile compact-on-tablet panel-fade-up">
      <p className="text-[10px] mb-2 font-medium tracking-widest text-white/30 uppercase">
        Haftalık Örüntü
      </p>

      <div className="flex gap-[2px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-1.5 justify-end">
          {Array.from({ length: 7 }, (_, dow) => (
            <div
              key={dow}
              className="h-[11px] flex items-center text-[8px] text-white/25 leading-none font-medium"
            >
              {dayName(dow)}
            </div>
          ))}
        </div>

        {/* Hour columns */}
        <div className="flex gap-[2px]">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="flex flex-col gap-[2px]">
              {/* Hour label (show every 6 hours) */}
              {hour % 6 === 0 ? (
                <div className="text-[7px] text-white/20 text-center h-3 leading-none font-medium tabular-nums">
                  {formatHour(hour).replace(" ", "")}
                </div>
              ) : (
                <div className="h-3" />
              )}

              {Array.from({ length: 7 }, (_, dow) => {
                const idx = dow * 24 + hour;
                const val = averages[idx];
                const enfFrac = cityEnforcedFraction[idx];
                const mostlyNotEnforced = enfFrac < 0.5;
                const isSelected = dow === timeSlot.dow && hour === timeSlot.hour;

                const bgColor = mostlyNotEnforced && val <= 0
                    ? "rgba(59, 130, 246, 0.3)"
                    : val > 0
                      ? occupancyToCss(val, !mostlyNotEnforced)
                      : "rgba(255,255,255,0.03)";

                const titleText = `${dayName(dow)} ${formatHour(hour)}: ${formatOccupancy(val, !mostlyNotEnforced)}`;

                return (
                  <button
                    key={dow}
                    onClick={() => onCellClick(dow, hour)}
                    className="w-[11px] h-[11px] rounded-[9px] transition-all duration-150 cursor-pointer hover:brightness-125 hover:scale-110"
                    style={{
                      backgroundColor: bgColor,
                      opacity: val > 0 || mostlyNotEnforced ? 0.85 : 0.25,
                      outline: isSelected ? "2px solid rgba(255,255,255,0.9)" : "none",
                      outlineOffset: "-1px",
                    }}
                    title={titleText}
                    aria-label={titleText}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




