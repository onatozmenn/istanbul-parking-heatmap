import { Loader2, X } from "lucide-react";
import type { GeoResult } from "../lib/geocode";
import { RADIUS_OPTIONS, type RadiusOption } from "../hooks/useSearch";

interface SearchBarProps {
  query: string;
  results: GeoResult[];
  isSearching: boolean;
  radius: RadiusOption;
  hasSelection: boolean;
  onQueryChange: (q: string) => void;
  onSelectResult: (r: GeoResult) => void;
  onClear: () => void;
  onRadiusChange: (r: RadiusOption) => void;
}

export function SearchBar({
  query,
  results,
  isSearching,
  radius,
  hasSelection,
  onQueryChange,
  onSelectResult,
  onClear,
  onRadiusChange,
}: SearchBarProps) {
  return (
    <div className="absolute left-3 right-3 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-30 sm:left-1/2 sm:right-auto sm:top-4 sm:w-[28rem] sm:-translate-x-1/2 lg:w-[31rem]">
      <div className="relative transition-all duration-200 ease-out active:scale-[0.985] focus-within:-translate-y-0.5 focus-within:scale-[1.01]">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Konum veya adres ara..."
          className="min-h-[3.5rem] w-full rounded-[20px] border border-white/[0.06] bg-[rgba(15,15,25,0.88)] pl-10 pr-10 py-4 text-[15px] text-white placeholder:text-white/28 shadow-none backdrop-blur-[20px] transition-all duration-200 focus:border-white/10 focus:outline-none focus:ring-1 focus:ring-white/8 focus:shadow-none sm:min-h-[3.4rem] sm:rounded-[12px] sm:pl-11 sm:pr-11 sm:py-3.5 sm:text-[15px]"
          role="combobox"
          aria-label="Adres arama"
          aria-expanded={results.length > 0 && !hasSelection}
          aria-autocomplete="list"
          aria-controls="search-results-list"
        />

        {(query || hasSelection) && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/10 sm:rounded-[9px] sm:p-1"
            aria-label="Aramayı temizle"
          >
            {isSearching ? (
              <Loader2 size={14} className="animate-spin text-white/[0.45]" />
            ) : (
              <X size={14} className="text-white/35" />
            )}
          </button>
        )}
      </div>

      {results.length > 0 && !hasSelection && (
        <div
          id="search-results-list"
          role="listbox"
          aria-label="Arama sonuçları"
          className="panel-fade-up mt-2 overflow-hidden rounded-2xl glass-panel sm:mt-1.5 sm:rounded-[9px]"
        >
          <div className="max-h-[38svh] overflow-y-auto sm:max-h-none">
            {results.map((result, index) => (
              <button
                key={`${result.name}-${index}`}
                onClick={() => onSelectResult(result)}
                role="option"
                className="w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.06] last:border-0 sm:py-2.5"
              >
                <span className="block text-[13px] text-white/[0.85]">{result.name}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-white/25">
                  {result.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSelection && (
        <div className="panel-fade-up mt-2 rounded-2xl glass-panel px-3 py-2.5 sm:rounded-[9px] sm:bg-transparent sm:px-0 sm:py-0 sm:border-0 sm:backdrop-blur-none sm:shadow-none">
          <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
            <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/[0.28]">
              Yarıçap
            </span>
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onRadiusChange(option)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                  radius === option
                    ? "bg-white text-gray-950"
                    : "bg-white/[0.06] text-white/[0.55]"
                } sm:rounded-[9px] sm:px-2.5 sm:py-1 sm:text-[10px]`}
              >
                {option}m
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
