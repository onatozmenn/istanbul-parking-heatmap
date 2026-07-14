import type { MapViewState } from "@deck.gl/core";

/** A metered block with its centroid and typical-week occupancy profile */
export interface BlockData {
  id: string;
  lat: number;
  lng: number;
  meters: number;
  street: string;
  hood: string;
  /** 168-element array indexed as (dow * 24 + hour), dow: 0=Mon..6=Sun (ISO) */
  slots: number[];
  /** 168-element array of 0/1 indicating meter enforcement per slot */
  enforced?: number[];
  /** Total parking spaces on this block (from supply data) */
  supply?: number;
  /** Grid-snapped 2-point path [[lng, lat], [lng, lat]] for PathLayer rendering */
  path?: [number, number][];
  /** Original individual meter positions [[lng, lat], ...] for deep-zoom dots */
  meterPositions?: [number, number][];
}

/** Pre-computed parking data loaded from parking_week.json */
export interface ParkingWeekData {
  generated: string;
  dateRange: { from: string; to: string };
  blocks: BlockData[];
}

/** Current time selection for the heatmap */
export interface TimeSlot {
  /** Day of week: 0=Monday through 6=Sunday (ISO 8601) */
  dow: number;
  /** Hour: 0-23 */
  hour: number;
}

/** Playback state */
export interface PlaybackState {
  isPlaying: boolean;
  speed: number; // ms per step
}

export type { MapViewState };
