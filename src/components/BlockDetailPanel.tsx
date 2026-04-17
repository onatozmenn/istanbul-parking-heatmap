import { Clock, Gauge, X } from "lucide-react";
import { occupancyToCss, occupancyLabel } from "../lib/colors";
import { deltaToCss, formatDelta } from "../lib/deltaColors";
import { dayName, formatHour, formatOccupancy } from "../lib/format";
import { getDataSource, getOccupancy, getTimeSlotIndex, isEnforced, isEnforcedAt } from "../lib/occupancy";
import type { BlockData, TimeSlot } from "../types";

interface BlockDetailPanelProps {
  block: BlockData | null;
  timeSlot: TimeSlot;
  onClose: () => void;
  comparing?: boolean;
  referenceSlot?: TimeSlot | null;
}

export function BlockDetailPanel({ block, timeSlot, onClose, comparing, referenceSlot }: BlockDetailPanelProps) {
  if (!block) return null;

  const currentOcc = getOccupancy(block, timeSlot);
  const enforced = isEnforced(block, timeSlot);
  const source = getDataSource(block, timeSlot);
  const slots = block.slots;

  return (
    <div
      className="panel-slide-in absolute inset-x-0 bottom-0 top-[24svh] z-30 overflow-y-auto rounded-t-[28px] border-t border-white/[0.08] bg-gray-950/95 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] backdrop-blur-xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-80 sm:rounded-none sm:border-l sm:border-t-0 sm:border-gray-800/50 sm:pb-0"
      role="complementary"
      aria-label="Blok detayları"
    >
      <div className="sticky top-0 z-10 border-b border-gray-800/30 bg-[rgba(3,7,18,0.92)] px-4 pb-3 pt-2 backdrop-blur-xl sm:pt-3">
        <div className="mx-auto mb-2 h-1 w-11 rounded-full bg-white/[0.14] sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/[0.28]">
              Seçili blok
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-white sm:text-sm">{block.id}</h2>
            {block.street && (
              <p className="mt-1 truncate text-[12px] text-gray-400 sm:text-xs">{block.street}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-white/[0.08] sm:rounded-[9px] sm:p-1"
            aria-label="Close"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-800/30 px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Gauge size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Mevcut seçim</span>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold leading-none" style={{ color: occupancyToCss(currentOcc, enforced) }}>
            {formatOccupancy(currentOcc, enforced)}
          </span>
          <span className="pb-1 text-sm" style={{ color: occupancyToCss(currentOcc, enforced) }}>
            {occupancyLabel(currentOcc, enforced)}
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {block.meters} sayaç bu blokta
          {!enforced && " / sayaçlar kapalı"}
          {block.supply != null && ` / ${block.supply} toplam yer`}
        </p>

        {source === "pressure" && (
          <p className="mt-1 text-[10px] text-gray-600">Değerler park şikayetlerinden tahmin edildi.</p>
        )}

        {comparing && referenceSlot && (() => {
          const refIdx = getTimeSlotIndex(referenceSlot.dow, referenceSlot.hour);
          const refOcc = block.slots[refIdx] ?? 0;
          const delta = currentOcc - refOcc;
          const hasData = currentOcc > 0 || refOcc > 0;

          return (
            <div className="mt-3 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-3 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Referans</span>
                <span className="font-medium text-white">{formatOccupancy(refOcc)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-400">Fark</span>
                <span className="text-sm font-bold" style={{ color: deltaToCss(delta, hasData) }}>
                  {hasData ? formatDelta(delta) : "N/A"}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Haftalık profil</span>
        </div>

        <div className="hide-scrollbar overflow-x-auto">
          <div className="inline-flex min-w-max gap-px">
            <div className="mr-1 flex flex-col gap-px pt-3">
              {Array.from({ length: 7 }, (_, dow) => (
                <div key={dow} className="flex h-[9px] items-center text-[7px] leading-none text-gray-500">
                  {dayName(dow)}
                </div>
              ))}
            </div>

            <div className="flex gap-px">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex flex-col gap-px">
                  <div className="flex h-3 items-end justify-center text-[6px] leading-none text-gray-600">
                    {hour % 6 === 0 ? `${hour}` : ""}
                  </div>

                  {Array.from({ length: 7 }, (_, dow) => {
                    const idx = dow * 24 + hour;
                    const occ = slots[idx];
                    const slotEnforced = isEnforcedAt(block, idx);
                    const isSelected = dow === timeSlot.dow && hour === timeSlot.hour;

                    return (
                      <div
                        key={dow}
                        className="h-[9px] w-[9px] rounded-[3px]"
                        style={{
                          backgroundColor:
                            !slotEnforced && occ <= 0
                              ? "rgba(59, 130, 246, 0.35)"
                              : occ > 0
                                ? occupancyToCss(occ, slotEnforced)
                                : "rgba(255,255,255,0.04)",
                          opacity: occ > 0 || !slotEnforced ? 0.85 : 0.3,
                          outline: isSelected ? "1px solid white" : "none",
                        }}
                        title={`${dayName(dow)} ${formatHour(hour)}: ${formatOccupancy(occ, slotEnforced)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800/30 px-4 py-4">
        <BestWorstTimes slots={slots} />
      </div>
    </div>
  );
}

function BestWorstTimes({ slots }: { slots: number[] }) {
  const businessSlots: { dow: number; hour: number; occ: number }[] = [];

  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 8; hour <= 20; hour++) {
      const idx = dow * 24 + hour;
      const occ = slots[idx];
      if (occ > 0) {
        businessSlots.push({ dow, hour, occ });
      }
    }
  }

  if (businessSlots.length === 0) {
    return <p className="text-xs text-gray-500">İş saatleri için veri yok</p>;
  }

  businessSlots.sort((a, b) => a.occ - b.occ);
  const best = businessSlots.slice(0, 3);
  const worst = businessSlots.slice(-3).reverse();

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-green-400">En kolay park</p>
        <div className="space-y-1.5">
          {best.map((slot, index) => (
            <p key={index} className="text-xs text-gray-300">
              {dayName(slot.dow)} {formatHour(slot.hour)} / {formatOccupancy(slot.occ)}
            </p>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-red-400">En zor park</p>
        <div className="space-y-1.5">
          {worst.map((slot, index) => (
            <p key={index} className="text-xs text-gray-300">
              {dayName(slot.dow)} {formatHour(slot.hour)} / {formatOccupancy(slot.occ)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
