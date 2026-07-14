import { useCallback, useMemo } from "react";
import { Map } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import type { Layer, PickingInfo, MapViewState } from "@deck.gl/core";
import "maplibre-gl/dist/maplibre-gl.css";

import type { BlockData, TimeSlot } from "../types";
import { METER_DOTS_ZOOM_MIN, getZoomTier } from "../lib/constants";
import { createParkingHeatmapLayer } from "../layers/parkingHeatmapLayer";
import { createParkingColumnLayer } from "../layers/parkingColumnLayer";
import type { ColumnStyle } from "../layers/parkingColumnLayer";
import { createParkingDeltaColumnLayer } from "../layers/parkingDeltaColumnLayer";
import { createParkingPathLayers } from "../layers/parkingPathLayer";
import { createParkingDeltaPathLayers } from "../layers/parkingDeltaPathLayer";
import { createMeterDotsLayer } from "../layers/meterDotsLayer";
import { getBlockTooltipContent, getDeltaTooltipContent } from "./BlockTooltip";

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface ParkingMapProps {
  blocks: BlockData[];
  timeSlot: TimeSlot;
  selectedBlockId: string | null;
  viewState: MapViewState;
  onViewStateChange: (vs: MapViewState) => void;
  onBlockClick: (block: BlockData | null) => void;
  extraLayers?: Layer[];
  comparing?: boolean;
  referenceSlot?: TimeSlot | null;
  columnStyle?: ColumnStyle;
}

export function ParkingMap({
  blocks,
  timeSlot,
  selectedBlockId,
  viewState,
  onViewStateChange,
  onBlockClick,
  extraLayers,
  comparing,
  referenceSlot,
  columnStyle = "hexgrid",
}: ParkingMapProps) {
  const zoom = viewState.zoom;
  const tier = getZoomTier(zoom);

  // Pre-split blocks by path availability once (stable references for deck.gl)
  const withPath = useMemo(
    () => blocks.filter((b) => b.path && b.path.length >= 2),
    [blocks],
  );
  const withoutPath = useMemo(
    () => blocks.filter((b) => !b.path || b.path.length < 2),
    [blocks],
  );

  const showMeterDots = zoom >= METER_DOTS_ZOOM_MIN;

  // Memoize layers so they aren't recreated on every pan/zoom frame
  const dataLayers = useMemo(() => {
    const layers: Layer[] = [];

    // Parking mode
    if (comparing && referenceSlot) {
      if (tier === "scatter") {
        layers.push(...createParkingDeltaPathLayers(withPath, withoutPath, timeSlot, referenceSlot, selectedBlockId));
      } else if (tier === "columns") {
        layers.push(createParkingDeltaColumnLayer(blocks, timeSlot, referenceSlot, selectedBlockId));
      } else {
        layers.push(createParkingHeatmapLayer(blocks, timeSlot));
      }
    } else {
      if (tier === "scatter") {
        layers.push(...createParkingPathLayers(withPath, withoutPath, timeSlot, selectedBlockId));
      } else if (tier === "columns") {
        layers.push(...createParkingColumnLayer(blocks, timeSlot, selectedBlockId, columnStyle));
      } else {
        layers.push(createParkingHeatmapLayer(blocks, timeSlot));
      }
    }

    // Add individual meter dots at deep zoom
    if (showMeterDots) {
      layers.push(createMeterDotsLayer(blocks, timeSlot));
    }

    return layers;
  }, [blocks, withPath, withoutPath, tier, timeSlot, selectedBlockId, comparing, referenceSlot, showMeterDots, columnStyle]);

  const layers = useMemo(
    () => [...dataLayers, ...(extraLayers ?? [])],
    [dataLayers, extraLayers],
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (info.object) {
        onBlockClick(info.object as BlockData);
      } else {
        onBlockClick(null);
      }
    },
    [onBlockClick],
  );

  const getTooltip = useCallback(
    (info: PickingInfo) => {
      if (!info.object) return null;
      if (comparing && referenceSlot) {
        return getDeltaTooltipContent(info.object as BlockData, timeSlot, referenceSlot);
      }
      return getBlockTooltipContent(info.object as BlockData, timeSlot);
    },
    [timeSlot, comparing, referenceSlot],
  );

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: vs }) =>
        onViewStateChange(vs as MapViewState)
      }
      layers={layers}
      onClick={handleClick}
      getTooltip={getTooltip}
      controller
      useDevicePixels={1}
    >
      <Map mapStyle={MAP_STYLE} attributionControl={false} pixelRatio={1} />
    </DeckGL>
  );
}




