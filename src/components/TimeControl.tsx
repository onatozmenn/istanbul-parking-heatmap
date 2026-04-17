import { Play, Pause } from "lucide-react";
import { dayName } from "../lib/format";
import { formatHour, formatTimeSlot } from "../lib/format";
import type { TimeSlot } from "../types";

interface TimeControlProps {
  timeSlot: TimeSlot;
  isPlaying: boolean;
  speed: number;
  onDowChange: (dow: number) => void;
  onHourChange: (hour: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  children?: React.ReactNode;
}

const SPEED_OPTIONS = [
  { label: "0.5x", value: 1000 },
  { label: "1x", value: 500 },
  { label: "2x", value: 250 },
  { label: "4x", value: 125 },
];

const HOUR_TICKS = [6, 9, 12, 15, 18, 21];

export function TimeControl({
  timeSlot,
  isPlaying,
  speed,
  onDowChange,
  onHourChange,
  onTogglePlay,
  onSpeedChange,
  children,
}: TimeControlProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none safe-bottom">
      <div className="mx-auto max-w-2xl px-2 sm:px-4 pb-3 sm:pb-4 pointer-events-auto">
        <div className="rounded-[9px] glass-panel px-3 sm:px-5 py-3 sm:py-4 panel-fade-up">
          {/* Current time label + comparison control */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <span className={`text-[12px] sm:text-[13px] font-medium text-white/90 tracking-wide ${isPlaying ? "play-pulse" : ""}`}>
              {formatTimeSlot(timeSlot.dow, timeSlot.hour)}
            </span>
            {children}
          </div>

          {/* Day pills */}
          <div className="flex justify-center gap-0.5 sm:gap-1 mb-2 sm:mb-4" role="tablist" aria-label="Haftanın günleri">
            {Array.from({ length: 7 }, (_, i) => (
              <button
                key={i}
                onClick={() => onDowChange(i)}
                role="tab"
                aria-selected={i === timeSlot.dow}
                aria-label={dayName(i)}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-[9px] text-[10px] sm:text-[11px] font-medium transition-all duration-200 ${
                  i === timeSlot.dow
                    ? "bg-white text-gray-900 shadow-md shadow-white/10"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                }`}
              >
                {dayName(i)}
              </button>
            ))}
          </div>

          {/* Hour slider + playback */}
          <div className="flex items-center gap-4">
            {/* Play/pause */}
            <button
              onClick={onTogglePlay}
              className="flex-shrink-0 w-9 h-9 rounded-[9px] bg-white/10 hover:bg-white/15 flex items-center justify-center transition-all duration-200 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
            </button>

            {/* Hour slider */}
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={23}
                value={timeSlot.hour}
                onChange={(e) => onHourChange(parseInt(e.target.value))}
                className="w-full"
                aria-label="Hour"
                aria-valuetext={formatHour(timeSlot.hour)}
              />
              {/* Tick labels */}
              <div className="flex justify-between mt-1 px-0.5">
                {HOUR_TICKS.map((h) => (
                  <span key={h} className="text-[10px] text-white/20 tabular-nums">
                    {formatHour(h)}
                  </span>
                ))}
              </div>
            </div>

            {/* Speed selector */}
            <div className="flex-shrink-0 items-center gap-0.5 bg-white/[0.04] rounded-[9px] p-0.5 hidden sm:flex" role="group" aria-label="Oynatma hızı">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSpeedChange(opt.value)}
                  aria-label={`Hız ${opt.label}`}
                  aria-pressed={speed === opt.value}
                  className={`text-[10px] px-2 py-1 rounded-[9px] transition-all duration-200 ${
                    speed === opt.value
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




