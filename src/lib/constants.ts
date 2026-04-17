/** Zoom tier boundaries for map visualisation switching */
export const COLUMN_ZOOM_MIN = 13;
export const SCATTER_ZOOM_MIN = 15.5;
export const METER_DOTS_ZOOM_MIN = 18;

/** Default map viewport centred on İstanbul */
export const DEFAULT_CENTER = { latitude: 41.0082, longitude: 28.9784 };
export const DEFAULT_ZOOM = 12;

/** Auto-pitch applied when entering column tier */
export const COLUMN_TIER_PITCH = 45;

/** Zoom tier type */
export type ZoomTier = "heatmap" | "columns" | "scatter";

/** Get the current zoom tier */
export function getZoomTier(zoom: number): ZoomTier {
  if (zoom >= SCATTER_ZOOM_MIN) return "scatter";
  if (zoom >= COLUMN_ZOOM_MIN) return "columns";
  return "heatmap";
}
