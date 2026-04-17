import { MapPin } from "lucide-react";
import { HotspotPanel } from "./HotspotPanel";
import type { BlockData, TimeSlot } from "../types";

interface IsochroneControlProps {
  isActive: boolean;
  blocks: BlockData[];
  timeSlot: TimeSlot;
  onToggleActive: () => void;
}

export function IsochroneControl({
  isActive,
  blocks,
  timeSlot,
  onToggleActive,
}: IsochroneControlProps) {
  return (
    <div className="absolute bottom-[15.5rem] left-3 right-3 z-30 flex flex-col items-end sm:bottom-auto sm:left-auto sm:right-4 sm:top-[7.5rem]">
      {isActive && (
        <HotspotPanel
          blocks={blocks}
          timeSlot={timeSlot}
          className="panel-slide-in mb-2 w-full sm:w-72"
        />
      )}

      <button
        onClick={onToggleActive}
        aria-pressed={isActive}
        aria-label="İzokron panelini aç kapa"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium shadow-[0_14px_35px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all sm:rounded-[9px] sm:px-3 sm:py-1.5 sm:text-xs sm:shadow-none ${
          isActive
            ? "border-white/[0.14] bg-white/[0.10] text-white"
            : "border-gray-700/50 bg-gray-900/80 text-gray-300 hover:border-gray-600 hover:text-white"
        }`}
      >
        <MapPin size={13} />
        İzokron
      </button>
    </div>
  );
}
