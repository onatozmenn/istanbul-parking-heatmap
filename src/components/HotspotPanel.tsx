import { MapPin, TrendingDown, TrendingUp } from "lucide-react";
import { occupancyToCss } from "../lib/colors";
import { formatOccupancy } from "../lib/format";
import { getOccupancy, isEnforced } from "../lib/occupancy";
import type { BlockData, TimeSlot } from "../types";

interface HotspotPanelProps {
  blocks: BlockData[];
  timeSlot: TimeSlot;
  className?: string;
}

interface HoodSummary {
  name: string;
  avgOcc: number;
}

function collectNeighborhoods(blocks: BlockData[], timeSlot: TimeSlot) {
  let enforcedCount = 0;
  let totalWithHood = 0;

  const hoodMap = new Map<string, { sum: number; count: number }>();

  for (const block of blocks) {
    if (!block.hood) continue;
    totalWithHood++;

    if (isEnforced(block, timeSlot)) enforcedCount++;

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

  const mostlyNotEnforced = totalWithHood > 0 && enforcedCount / totalWithHood < 0.3;

  const hoods: HoodSummary[] = [];
  for (const [name, value] of hoodMap) {
    if (value.count >= 3) {
      hoods.push({ name, avgOcc: value.sum / value.count });
    }
  }

  const busiest = [...hoods].sort((a, b) => b.avgOcc - a.avgOcc).slice(0, 3);
  const emptiest = [...hoods]
    .filter((hood) => hood.avgOcc > 0)
    .sort((a, b) => a.avgOcc - b.avgOcc)
    .slice(0, 3);

  return { mostlyNotEnforced, busiest, emptiest };
}

export function HotspotPanel({ blocks, timeSlot, className = "" }: HotspotPanelProps) {
  const { mostlyNotEnforced, busiest, emptiest } = collectNeighborhoods(blocks, timeSlot);

  if (busiest.length === 0 && emptiest.length === 0 && !mostlyNotEnforced) {
    return null;
  }

  return (
    <div className={`rounded-3xl glass-panel px-4 py-3 sm:rounded-[9px] ${className}`.trim()}>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/[0.34]">
          İzokron
        </span>
        <MapPin size={14} className="text-white/55" />
      </div>

      {mostlyNotEnforced && busiest.length === 0 && emptiest.length === 0 ? (
        <div>
          <p className="text-sm font-medium text-blue-300">Sayaçlar kapalı</p>
          <p className="mt-1 text-[11px] text-white/45">
            Bu saat aralığında ücretsiz park daha yaygın.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15">
                <TrendingUp size={11} className="text-red-400" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/[0.34]">
                En yoğun
              </span>
            </div>

            <div className="space-y-1.5">
              {busiest.map((hood) => (
                <div key={hood.name} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-white/82">{hood.name}</span>
                  <span
                    className="shrink-0 text-[13px] font-semibold tabular-nums"
                    style={{ color: occupancyToCss(hood.avgOcc) }}
                  >
                    {formatOccupancy(hood.avgOcc)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-white/[0.06] pt-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15">
                <TrendingDown size={11} className="text-green-400" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/[0.34]">
                En müsait
              </span>
            </div>

            <div className="space-y-1.5">
              {emptiest.map((hood) => (
                <div key={hood.name} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[13px] text-white/82">{hood.name}</span>
                  <span
                    className="shrink-0 text-[13px] font-semibold tabular-nums"
                    style={{ color: occupancyToCss(hood.avgOcc) }}
                  >
                    {formatOccupancy(hood.avgOcc)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
