import { useState } from "react";
import { ChevronDown, ChevronUp, Pause, Play } from "lucide-react";
import { dayName, formatHour, formatTimeSlot } from "../lib/format";
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
  mobilePanel?: React.ReactNode;
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
  mobilePanel,
}: TimeControlProps) {
  const [showInsights, setShowInsights] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-20 sm:bottom-6">
      <div className="pointer-events-auto px-3 pb-3 sm:hidden">
        <div className="mobile-sheet panel-fade-up rounded-[28px] glass-panel px-4 pb-4 pt-2.5">
          <div className="mx-auto h-1 w-11 rounded-full bg-white/[0.14]" />

          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-semibold tracking-tight text-white ${isPlaying ? "play-pulse" : ""}`}>
                {formatTimeSlot(timeSlot.dow, timeSlot.hour)}
              </p>
            </div>
            {children && <div className="shrink-0">{children}</div>}
          </div>

          <div className="hide-scrollbar mt-3 overflow-x-auto">
            <div className="flex min-w-max gap-1.5 pb-1">
              {Array.from({ length: 7 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => onDowChange(i)}
                  role="tab"
                  aria-selected={i === timeSlot.dow}
                  aria-label={dayName(i)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    i === timeSlot.dow
                      ? "bg-white text-gray-950"
                      : "bg-white/[0.06] text-white/[0.58]"
                  }`}
                >
                  {dayName(i)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-950 transition-transform active:scale-95"
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/[0.24]">Saat</span>
                <span className="text-[12px] font-medium tabular-nums text-white/[0.72]">{formatHour(timeSlot.hour)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                value={timeSlot.hour}
                onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
                className="w-full"
                aria-label="Saat"
                aria-valuetext={formatHour(timeSlot.hour)}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="hide-scrollbar flex items-center gap-1 overflow-x-auto rounded-full bg-white/[0.04] p-1">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSpeedChange(opt.value)}
                  aria-label={`Hız ${opt.label}`}
                  aria-pressed={speed === opt.value}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    speed === opt.value
                      ? "bg-white text-gray-950"
                      : "text-white/[0.45]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {mobilePanel && (
              <button
                onClick={() => setShowInsights((value) => !value)}
                className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/[0.72]"
                aria-expanded={showInsights}
              >
                Haftalık
                {showInsights ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          </div>

          {showInsights && mobilePanel && (
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              {mobilePanel}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-auto hidden px-5 sm:block">
        <div className="panel-fade-up mx-auto w-full max-w-3xl rounded-[9px] glass-panel px-5 py-4 sm:translate-x-6" style={{ boxShadow: "none" }}>
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className={`text-[13px] font-medium tracking-wide text-white/90 ${isPlaying ? "play-pulse" : ""}`}>
              {formatTimeSlot(timeSlot.dow, timeSlot.hour)}
            </span>
            {children}
          </div>

          <div className="mb-4 flex justify-center gap-1" role="tablist" aria-label="Haftanın günleri">
            {Array.from({ length: 7 }, (_, i) => (
              <button
                key={i}
                onClick={() => onDowChange(i)}
                role="tab"
                aria-selected={i === timeSlot.dow}
                aria-label={dayName(i)}
                className={`rounded-[9px] px-3.5 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                  i === timeSlot.dow
                    ? "bg-white text-gray-900 shadow-md shadow-white/10"
                    : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                }`}
              >
                {dayName(i)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onTogglePlay}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-white/10 transition-all duration-200 hover:bg-white/15 active:scale-95"
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="ml-0.5 text-white" />}
            </button>

            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={23}
                value={timeSlot.hour}
                onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
                className="w-full"
                aria-label="Saat"
                aria-valuetext={formatHour(timeSlot.hour)}
              />
              <div className="mt-1 flex justify-between px-0.5">
                {HOUR_TICKS.map((hour) => (
                  <span key={hour} className="text-[10px] tabular-nums text-white/20">
                    {formatHour(hour)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 rounded-[9px] bg-white/[0.04] p-0.5" role="group" aria-label="Oynatma hızı">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSpeedChange(opt.value)}
                  aria-label={`Hız ${opt.label}`}
                  aria-pressed={speed === opt.value}
                  className={`rounded-[9px] px-2 py-1 text-[10px] transition-all duration-200 ${
                    speed === opt.value
                      ? "bg-white/15 font-medium text-white"
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
