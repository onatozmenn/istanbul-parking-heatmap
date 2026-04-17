import { TrendingUp, TrendingDown } from "lucide-react";
import type { BlockData, TimeSlot } from "../types";
import { getOccupancy, isEnforced } from "../lib/occupancy";
import { formatOccupancy } from "../lib/format";
import { occupancyToCss } from "../lib/colors";

interface NeighborhoodSummaryProps {
  blocks: BlockData[];
  timeSlot: TimeSlot;
}

interface HoodSummary {
  name: string;
  avgOcc: number;
  blockCount: number;
}

export function NeighborhoodSummary({ blocks, timeSlot }: NeighborhoodSummaryProps) {
  // Check if most blocks are non-enforced right now
  let enforcedCount = 0;
  let totalWithHood = 0;
  for (const block of blocks) {
    if (!block.hood) continue;
    totalWithHood++;
    if (isEnforced(block, timeSlot)) enforcedCount++;
  }
  const mostlyNotEnforced = totalWithHood > 0 && enforcedCount / totalWithHood < 0.3;

  // Group blocks by neighborhood and compute average occupancy
  const hoodMap = new Map<string, { sum: number; count: number }>();
  for (const block of blocks) {
    if (!block.hood) continue;
    const occ = getOccupancy(block, timeSlot);
    if (occ <= 0) continue;

    const existing = hoodMap.get(block.hood);
    if (existing) {
      existing.sum += occ;
      existing.count++;
    } else {
      hoodMap.set(block.hood, { sum: occ, count: 1 });
    }
  }

  const hoods: HoodSummary[] = [];
  for (const [name, { sum, count }] of hoodMap) {
    if (count >= 3) {
      hoods.push({ name, avgOcc: sum / count, blockCount: count });
    }
  }

  // During fully non-enforced hours with no data, show meters off message
  if (hoods.length === 0) {
    if (mostlyNotEnforced) {
      return (
        <div className="absolute top-16 right-4 z-20 rounded-[9px] glass-panel p-4 w-56 hide-on-mobile panel-fade-up">
          <p className="text-xs text-blue-400 font-medium">Sayaçlar Kapalı</p>
          <p className="text-[10px] text-white/30 mt-1">
            Sayaçların kapalı olduğu saatlerde ücretsiz park
          </p>
        </div>
      );
    }
    return null;
  }

  hoods.sort((a, b) => b.avgOcc - a.avgOcc);
  const busiest = hoods.slice(0, 3);
  const emptiest = hoods
    .filter((h) => h.avgOcc > 0)
    .sort((a, b) => a.avgOcc - b.avgOcc)
    .slice(0, 3);

  return (
    <div className="absolute top-16 right-4 z-20 rounded-[9px] glass-panel p-4 w-56 hide-on-mobile panel-fade-up">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-[9px] bg-red-500/15 flex items-center justify-center">
            <TrendingUp size={11} className="text-red-400" />
          </div>
          <span className="text-[10px] text-white/35 font-medium tracking-widest uppercase">
            En Yoğun
          </span>
        </div>
        {busiest.map((h) => (
          <div key={h.name} className="flex justify-between items-center py-1">
            <span className="text-[12px] text-white/70 truncate mr-2">{h.name}</span>
            <span
              className="text-[12px] font-medium flex-shrink-0 tabular-nums"
              style={{ color: occupancyToCss(h.avgOcc) }}
            >
              {formatOccupancy(h.avgOcc)}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-[9px] bg-green-500/15 flex items-center justify-center">
            <TrendingDown size={11} className="text-green-400" />
          </div>
          <span className="text-[10px] text-white/35 font-medium tracking-widest uppercase">
            En Müsait
          </span>
        </div>
        {emptiest.map((h) => (
          <div key={h.name} className="flex justify-between items-center py-1">
            <span className="text-[12px] text-white/70 truncate mr-2">{h.name}</span>
            <span
              className="text-[12px] font-medium flex-shrink-0 tabular-nums"
              style={{ color: occupancyToCss(h.avgOcc) }}
            >
              {formatOccupancy(h.avgOcc)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}




