import { Bike, Car, Footprints, MapPin, X } from "lucide-react";
import { modeAccentCss } from "../lib/isochroneColors";
import type { IsochroneOrigin, TransportMode } from "../types";

const MODES: { key: TransportMode; icon: typeof Car; label: string }[] = [
  { key: "driving", icon: Car, label: "Araç" },
  { key: "cycling", icon: Bike, label: "Bisiklet" },
  { key: "walking", icon: Footprints, label: "Yürüyüş" },
];

interface IsochroneControlProps {
  isActive: boolean;
  origin: IsochroneOrigin | null;
  mode: TransportMode;
  maxMinutes: number;
  loading: boolean;
  error?: string | null;
  snapDistance?: number | null;
  profileName?: string | null;
  onToggleActive: () => void;
  onModeChange: (mode: TransportMode) => void;
  onMaxMinutesChange: (minutes: number) => void;
  onClearOrigin: () => void;
  children?: React.ReactNode;
}

export function IsochroneControl({
  isActive,
  origin,
  mode,
  maxMinutes,
  loading,
  error,
  snapDistance,
  profileName,
  onToggleActive,
  onModeChange,
  onMaxMinutesChange,
  onClearOrigin,
  children,
}: IsochroneControlProps) {
  const accent = modeAccentCss(mode);

  return (
    <div className="absolute bottom-[15.5rem] left-3 right-3 z-30 flex flex-col items-end sm:bottom-auto sm:left-auto sm:right-4 sm:top-14">
      {isActive && (
        <div className="panel-slide-in mb-2 w-full rounded-3xl glass-panel p-3 sm:w-56 sm:rounded-[9px]">
          <div className="mb-3 flex gap-1" role="group" aria-label="Ulaşım modu">
            {MODES.map(({ key, icon: Icon, label }) => {
              const selected = mode === key;
              const modeColor = modeAccentCss(key);

              return (
                <button
                  key={key}
                  onClick={() => onModeChange(key)}
                  aria-pressed={selected}
                  aria-label={`${label} modu`}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border py-2 text-[10px] transition-all sm:rounded-[9px] sm:py-1.5 ${
                    selected
                      ? "border-opacity-50 bg-opacity-20 font-medium"
                      : "border-gray-700/30 bg-gray-800/40 text-gray-500 hover:text-gray-300"
                  }`}
                  style={selected ? {
                    color: modeColor,
                    borderColor: `${modeColor}40`,
                    backgroundColor: `${modeColor}15`,
                  } : undefined}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mb-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[9px] uppercase tracking-[0.16em] text-gray-500">Yolculuk süresi</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
                {maxMinutes} dk
              </span>
            </div>

            <div className="relative">
              <div
                className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                style={{ background: `linear-gradient(to right, ${accent}, ${accent}30)` }}
              />
              <input
                type="range"
                min={2}
                max={20}
                step={2}
                value={maxMinutes}
                onChange={(e) => onMaxMinutesChange(Number(e.target.value))}
                aria-label="Yolculuk süresi"
                aria-valuemin={2}
                aria-valuemax={20}
                aria-valuenow={maxMinutes}
                aria-valuetext={`${maxMinutes} dakika`}
                className="relative h-4 w-full appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-gray-400
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-moz-range-thumb]:h-3.5
                  [&::-moz-range-thumb]:w-3.5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-gray-400
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-track]:bg-transparent
                  [&::-webkit-slider-runnable-track]:bg-transparent"
              />
            </div>

            <div className="mt-1 flex justify-between text-[9px] tabular-nums text-gray-600">
              <span>2</span>
              <span>10</span>
              <span>20</span>
            </div>

            {profileName && (
              <p className="mt-1 text-center text-[9px] italic text-gray-500">{profileName}</p>
            )}
          </div>

          {loading && (
            <p className="text-[10px] text-gray-500 animate-pulse">İzokron verisi yükleniyor...</p>
          )}

          {error && !loading && (
            <div className="mb-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-2.5 py-2 sm:rounded-[9px]">
              <p className="mb-0.5 text-[10px] font-medium text-red-400">İzokron verisi yüklenemedi</p>
              <p className="text-[9px] text-red-300/70">{error}</p>
              <p className="mt-1 text-[9px] text-gray-500">
                Valhalla servisi açık olmadan izokron alanları gösterilemez.
              </p>
            </div>
          )}

          {!origin && !loading && (
            <div className="py-1 text-center">
              <p className="text-[10px] text-gray-500">Başlangıç için haritaya dokunun</p>
              <p className="mt-0.5 text-[9px] text-gray-600">Halkalar ulaşılabilir alanı gösterir</p>
            </div>
          )}

          {origin && (
            <div className="flex items-center justify-between rounded-2xl bg-gray-900/50 px-2.5 py-2 sm:rounded-[9px] sm:px-2 sm:py-1.5">
              <div className="text-[10px]">
                <span className="text-gray-400">
                  {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </span>
                {snapDistance != null && (
                  <span className="ml-1 text-gray-600">({snapDistance}m snap)</span>
                )}
              </div>

              <button
                onClick={onClearOrigin}
                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 sm:rounded-[9px] sm:p-0.5"
                aria-label="Başlangıç noktasını temizle"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {children}
        </div>
      )}

      <button
        onClick={onToggleActive}
        aria-pressed={isActive}
        aria-label="İzokron analizi aç kapa"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium shadow-[0_14px_35px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all sm:rounded-[9px] sm:px-3 sm:py-1.5 sm:text-xs sm:shadow-none ${
          isActive
            ? "border-indigo-500/50 bg-indigo-500/30 text-indigo-200"
            : "border-gray-700/50 bg-gray-900/80 text-gray-300 hover:border-gray-600 hover:text-white"
        }`}
      >
        <MapPin size={13} />
        İzokron
      </button>
    </div>
  );
}
