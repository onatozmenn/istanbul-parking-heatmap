import { HotspotPanel } from "./HotspotPanel";
import type { BlockData, TimeSlot } from "../types";

interface IsochroneControlProps {
  blocks: BlockData[];
  timeSlot: TimeSlot;
}

export function IsochroneControl({ blocks, timeSlot }: IsochroneControlProps) {
  return (
    <div className="absolute bottom-[15.5rem] left-3 right-3 z-30 sm:bottom-auto sm:left-auto sm:right-4 sm:top-14">
      <HotspotPanel
        blocks={blocks}
        timeSlot={timeSlot}
        className="panel-slide-in w-full sm:w-80"
      />
    </div>
  );
}
