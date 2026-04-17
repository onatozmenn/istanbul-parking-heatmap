import { X, Loader2 } from "lucide-react";
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
    <div className="absolute top-14 sm:top-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-30 sm:w-80">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Konum veya adres ara..."
          className="w-full px-4 pr-10 py-2.5 rounded-[9px] bg-[rgba(15,15,25,0.75)] backdrop-blur-[20px] border border-white/[0.06] text-[13px] text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
          role="combobox"
          aria-label="Adres arama"
          aria-expanded={results.length > 0 && !hasSelection}
          aria-autocomplete="list"
          aria-controls="search-results-list"
        />
        {(query || hasSelection) && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[9px] hover:bg-white/10 transition-colors"
            aria-label="Aramayı temizle"
          >
            {isSearching ? (
              <Loader2 size={14} className="text-white/40 animate-spin" />
            ) : (
              <X size={14} className="text-white/30" />
            )}
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {results.length > 0 && !hasSelection && (
        <div id="search-results-list" role="listbox" aria-label="Arama sonuçları" className="mt-1.5 rounded-[9px] glass-panel overflow-hidden panel-fade-up">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onSelectResult(r)}
              role="option"
              className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0"
            >
              <span className="text-white/80">{r.name}</span>
              <span className="text-[10px] text-white/25 ml-2">{r.type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Radius selector (shown when a result is selected) */}
      {hasSelection && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="text-[10px] text-white/30 mr-1">Yarıçap</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={`text-[10px] px-2.5 py-1 rounded-[9px] transition-all duration-200 ${
                radius === r
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
              }`}
            >
              {r}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}




