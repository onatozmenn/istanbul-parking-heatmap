import { MapPin } from "lucide-react";
import { occupancyToCss, occupancyLabel } from "../lib/colors";
import { formatOccupancy } from "../lib/format";
import { getOccupancy, isEnforced } from "../lib/occupancy";
import type { BlockData, TimeSlot } from "../types";

interface SearchResultsProps {
  blocks: BlockData[];
  timeSlot: TimeSlot;
  onBlockClick: (block: BlockData) => void;
}

export function SearchResults({ blocks, timeSlot, onBlockClick }: SearchResultsProps) {
  if (blocks.length === 0) {
    return (
      <div className="absolute bottom-[15.5rem] left-3 right-3 z-30 rounded-3xl glass-panel px-4 py-3 sm:top-20 sm:bottom-auto sm:left-4 sm:right-auto sm:w-64 sm:rounded-[9px]">
        <p className="text-center text-xs text-gray-400">Bu alanda blok bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="panel-slide-in absolute bottom-[15.5rem] left-3 right-3 z-30 max-h-[32svh] overflow-hidden rounded-3xl glass-panel sm:top-20 sm:bottom-auto sm:left-4 sm:right-auto sm:max-h-[60vh] sm:w-64 sm:rounded-[9px]">
      <div className="border-b border-gray-800/30 px-4 py-3 sm:px-3 sm:py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/[0.32] sm:tracking-wider">
          {blocks.length} yakın blok
        </p>
      </div>

      <div className="max-h-[calc(32svh-52px)] overflow-y-auto sm:max-h-[calc(60vh-32px)]">
        {blocks.map((block) => {
          const occupancy = getOccupancy(block, timeSlot);
          const enforced = isEnforced(block, timeSlot);

          return (
            <button
              key={block.id}
              onClick={() => onBlockClick(block)}
              className="w-full border-b border-gray-800/20 px-4 py-3 text-left transition-colors hover:bg-gray-800/40 last:border-0 sm:px-3 sm:py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin size={11} className="shrink-0 text-gray-500" />
                    <span className="truncate text-[13px] text-white sm:text-xs">{block.id}</span>
                  </div>
                  <span className="mt-1 block truncate text-[11px] text-gray-500 sm:text-[10px]">
                    {block.street || block.hood}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className="block text-[13px] font-semibold sm:text-xs"
                    style={{ color: occupancyToCss(occupancy, enforced) }}
                  >
                    {formatOccupancy(occupancy, enforced)}
                  </span>
                  <span
                    className="mt-1 block text-[10px] sm:text-[9px]"
                    style={{ color: occupancyToCss(occupancy, enforced) }}
                  >
                    {occupancyLabel(occupancy, enforced)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
