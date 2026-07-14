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
      <div className="absolute bottom-[13.5rem] left-3 right-3 z-30 rounded-lg glass-panel px-4 py-3 lg:bottom-auto lg:left-4 lg:right-auto lg:top-24 lg:w-64">
        <p className="text-center text-xs text-gray-400">Bu alanda blok bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="panel-slide-in absolute bottom-[13.5rem] left-3 right-3 z-30 max-h-[32svh] overflow-hidden rounded-lg glass-panel lg:bottom-auto lg:left-4 lg:right-auto lg:top-24 lg:max-h-[60vh] lg:w-64">
      <div className="border-b border-gray-800/30 px-4 py-3 lg:px-3 lg:py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/[0.32] lg:tracking-wider">
          {blocks.length} yakın blok
        </p>
      </div>

      <div className="max-h-[calc(32svh-52px)] overflow-y-auto lg:max-h-[calc(60vh-32px)]">
        {blocks.map((block) => {
          const occupancy = getOccupancy(block, timeSlot);
          const enforced = isEnforced(block, timeSlot);

          return (
            <button
              key={block.id}
              onClick={() => onBlockClick(block)}
              className="w-full border-b border-gray-800/20 px-4 py-3 text-left transition-colors hover:bg-gray-800/40 last:border-0 lg:px-3 lg:py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin size={11} className="shrink-0 text-gray-500" />
                    <span className="truncate text-[13px] text-white lg:text-xs">{block.id}</span>
                  </div>
                  <span className="mt-1 block truncate text-[11px] text-gray-500 lg:text-[10px]">
                    {block.street || block.hood}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className="block text-[13px] font-semibold lg:text-xs"
                    style={{ color: occupancyToCss(occupancy, enforced) }}
                  >
                    {formatOccupancy(occupancy, enforced)}
                  </span>
                  <span
                    className="mt-1 block text-[10px] lg:text-[9px]"
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
