import { Pin, X } from "lucide-react";
import { formatTimeSlot } from "../lib/format";
import type { TimeSlot } from "../types";

interface ComparisonControlProps {
  comparing: boolean;
  referenceSlot: TimeSlot | null;
  currentSlot: TimeSlot;
  onPin: () => void;
  onExit: () => void;
}

export function ComparisonControl({
  comparing,
  referenceSlot,
  currentSlot,
  onPin,
  onExit,
}: ComparisonControlProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:justify-center sm:gap-2">
      <button
        onClick={onPin}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all sm:rounded-[9px] sm:px-2.5 sm:py-1 sm:text-xs ${
          comparing
            ? "bg-purple-500/[0.85] text-white"
            : "border border-gray-700/50 bg-gray-800/60 text-gray-300 hover:bg-gray-700/60"
        }`}
        title={comparing ? "Karşılaştırmadan çık" : `${formatTimeSlot(currentSlot.dow, currentSlot.hour)} referans olarak sabitle`}
      >
        <Pin size={12} />
        <span className="sm:hidden">{comparing ? "Fark" : "Kıyasla"}</span>
        <span className="hidden sm:inline">{comparing ? "Karşılaştırılıyor" : "Karşılaştır"}</span>
      </button>

      {comparing && referenceSlot && (
        <>
          <span className="text-[10px] text-purple-200/90 sm:text-[10px] sm:text-purple-300">
            vs {formatTimeSlot(referenceSlot.dow, referenceSlot.hour)}
          </span>
          <button
            onClick={onExit}
            className="rounded-full p-1 transition-colors hover:bg-white/[0.08] sm:rounded-[9px] sm:p-0.5"
            title="Karşılaştırmadan çık"
          >
            <X size={12} className="text-gray-400" />
          </button>
        </>
      )}
    </div>
  );
}
