import { Car, Bike, Footprints, MapPin, X } from "lucide-react";
import type { TransportMode, IsochroneOrigin } from "../types";
import { modeAccentCss } from "../lib/isochroneColors";

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
    <div className="absolute top-14 right-4 z-30">
      {/* Toggle button */}
      <button
        onClick={onToggleActive}
        aria-pressed={isActive}
        aria-label="İzokron analizi aç/kapat"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-medium transition-all ${
          isActive
            ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 shadow-lg shadow-indigo-500/10"
            : "bg-gray-900/80 text-gray-400 border border-gray-700/50 hover:text-gray-200 hover:border-gray-600"
        } backdrop-blur-md`}
      >
        <MapPin size={14} />
        İzokron
      </button>

      {/* Expanded panel */}
      {isActive && (
        <div className="mt-2 rounded-[9px] glass-panel p-3 w-56 panel-slide-in">
          {/* Mode selector */}
          <div className="flex gap-1 mb-3" role="group" aria-label="Ulaşım modu">
            {MODES.map(({ key, icon: Icon, label }) => {
              const isSelected = mode === key;
              const modeColor = modeAccentCss(key);
              return (
                <button
                  key={key}
                  onClick={() => onModeChange(key)}
                  aria-pressed={isSelected}
                  aria-label={`${label} modu`}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-[9px] text-[10px] border transition-all ${
                    isSelected
                      ? "border-opacity-50 bg-opacity-20 font-medium"
                      : "bg-gray-800/40 text-gray-500 border-gray-700/30 hover:text-gray-300"
                  }`}
                  style={isSelected ? {
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

          {/* Travel time slider */}
          <div className="mb-3">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                Yolculuk süresi
              </span>
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color: accent }}
              >
                {maxMinutes} min
              </span>
            </div>

            {/* Gradient track behind the slider */}
            <div className="relative">
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-[9px]"
                style={{
                  background: `linear-gradient(to right, ${accent}, ${accent}30)`,
                }}
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
                className="relative w-full h-4 appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-gray-400
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-moz-range-thumb]:w-3.5
                  [&::-moz-range-thumb]:h-3.5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-gray-400
                  [&::-moz-range-thumb]:cursor-grab
                  [&::-moz-range-track]:bg-transparent
                  [&::-webkit-slider-runnable-track]:bg-transparent"
              />
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] text-gray-600 tabular-nums">
              <span>2</span>
              <span>10</span>
              <span>20</span>
            </div>

            {/* Active speed profile indicator */}
            {profileName && (
              <p className="text-[9px] text-gray-500 mt-1 text-center italic">
                {profileName}
              </p>
            )}
          </div>

          {/* Status */}
          {loading && (
            <p className="text-[10px] text-gray-500 animate-pulse">
              İzokron verisi yükleniyor...
            </p>
          )}

          {error && !loading && (
            <div className="rounded-[9px] bg-red-500/10 border border-red-500/30 px-2.5 py-2 mb-2">
              <p className="text-[10px] text-red-400 font-medium mb-0.5">İzokron verisi yüklenemedi</p>
              <p className="text-[9px] text-red-300/70">{error}</p>
              <p className="text-[9px] text-gray-500 mt-1">
                Valhalla docker servisini başlatıp izokron verisi oluşturmanız gerekiyor.
              </p>
            </div>
          )}

          {!origin && !loading && (
            <div className="text-center py-1">
              <p className="text-[10px] text-gray-500">
                Başlangıç için haritaya tıklayın
              </p>
              <p className="text-[9px] text-gray-600 mt-0.5">
                Halkalar ulaşılabilir alanı gösterir
              </p>
            </div>
          )}

          {origin && (
            <div className="flex items-center justify-between bg-gray-900/50 rounded-[9px] px-2 py-1.5">
              <div className="text-[10px]">
                <span className="text-gray-400">
                  {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </span>
                {snapDistance != null && (
                  <span className="text-gray-600 ml-1">
                    ({snapDistance}m snap)
                  </span>
                )}
              </div>
              <button
                onClick={onClearOrigin}
                className="p-0.5 rounded-[9px] hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Başlangıç noktasını temizle"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Slotted content (IsochroneAnalysis) */}
          {children}
        </div>
      )}
    </div>
  );
}




