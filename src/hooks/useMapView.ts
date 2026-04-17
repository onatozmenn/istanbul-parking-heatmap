import { useState, useCallback, useRef } from "react";
import { FlyToInterpolator } from "deck.gl";
import type { MapViewState } from "deck.gl";
import { DEFAULT_CENTER, DEFAULT_ZOOM, COLUMN_TIER_PITCH, getZoomTier } from "../lib/constants";
import type { ZoomTier } from "../lib/constants";

const DEFAULT_VIEW: MapViewState = {
  longitude: DEFAULT_CENTER.longitude,
  latitude: DEFAULT_CENTER.latitude,
  zoom: DEFAULT_ZOOM,
  pitch: 0,
  bearing: 0,
};

export function useMapView(initialOverrides?: Partial<MapViewState>) {
  const initialZoom = initialOverrides?.zoom ?? DEFAULT_VIEW.zoom;
  const initialPitch =
    initialOverrides?.pitch ??
    (getZoomTier(initialZoom) !== "heatmap" ? COLUMN_TIER_PITCH : 0);

  const [viewState, setViewState] = useState<MapViewState>({
    ...DEFAULT_VIEW,
    ...initialOverrides,
    pitch: initialPitch,
  });

  // Track previous zoom tier for auto-pitch on tier crossing
  const prevTierRef = useRef<ZoomTier>(getZoomTier(viewState.zoom));
  // Track whether user has manually set pitch in column tier
  const userPitchRef = useRef(false);

  const flyTo = useCallback((longitude: number, latitude: number, zoom?: number) => {
    setViewState((prev) => ({
      ...prev,
      longitude,
      latitude,
      zoom: zoom ?? Math.max(prev.zoom, 15),
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  }, []);

  const onViewStateChange = useCallback((vs: MapViewState) => {
    const newTier = getZoomTier(vs.zoom);
    const prevTier = prevTierRef.current;

    // Auto-pitch when entering column tier from heatmap
    if (newTier === "columns" && prevTier === "heatmap" && !userPitchRef.current) {
      vs = { ...vs, pitch: COLUMN_TIER_PITCH };
    }
    // Reset pitch when leaving column tier to heatmap
    if (newTier === "heatmap" && prevTier === "columns") {
      vs = { ...vs, pitch: 0 };
      userPitchRef.current = false;
    }

    // Detect manual pitch adjustment while in column tier
    if (newTier === "columns" && prevTier === "columns") {
      userPitchRef.current = true;
    }

    prevTierRef.current = newTier;
    setViewState(vs);
  }, []);

  return {
    viewState,
    setViewState,
    onViewStateChange,
    flyTo,
  };
}
