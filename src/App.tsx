import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlockData } from "./types";
import type { ColumnStyle } from "./layers/parkingColumnLayer";
import { COLUMN_ZOOM_MIN, SCATTER_ZOOM_MIN } from "./lib/constants";
import { useParkingData } from "./hooks/useParkingData";
import { useTimeSlot } from "./hooks/useTimeSlot";
import { useMapView } from "./hooks/useMapView";
import { getInitialUrlState, useUrlSync } from "./hooks/useUrlState";
import { useSearch } from "./hooks/useSearch";
import { useComparison } from "./hooks/useComparison";
import { createRadiusOverlayLayer } from "./layers/radiusOverlayLayer";
import { ParkingMap } from "./components/ParkingMap";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { IsochroneControl } from "./components/IsochroneControl";
import { SearchResults } from "./components/SearchResults";
import { WeekHeatmap } from "./components/WeekHeatmap";
import { Legend } from "./components/Legend";
import { TimeControl } from "./components/TimeControl";
import { ComparisonControl } from "./components/ComparisonControl";
import { BlockDetailPanel } from "./components/BlockDetailPanel";
import { MobileInsightsPanel } from "./components/MobileInsightsPanel";

const urlInit = getInitialUrlState();

function App() {
  const { blocks, cityAverages, cityEnforcedFraction, loading, error, generated } = useParkingData();
  const { timeSlot, isPlaying, speed, setDow, setHour, setSlot, setSpeed, togglePlay } =
    useTimeSlot(urlInit.timeSlot);
  const { viewState, onViewStateChange, flyTo } = useMapView(urlInit.viewState);

  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [columnStyle, setColumnStyle] = useState<ColumnStyle>("columns");

  const search = useSearch(blocks, timeSlot);
  const comparison = useComparison(urlInit.comparing, urlInit.refDow, urlInit.refHour);
  const pendingBlockId = useMemo(() => urlInit.blockId ?? null, []);

  useEffect(() => {
    if (pendingBlockId && blocks.length > 0 && !selectedBlock) {
      const found = blocks.find((block) => block.id === pendingBlockId);
      if (found) setSelectedBlock(found);
    }
  }, [blocks, pendingBlockId, selectedBlock]);

  useUrlSync({
    timeSlot,
    viewState,
    selectedBlockId: selectedBlock?.id ?? null,
    isPlaying,
    searchLat: search.selectedResult?.lat,
    searchLng: search.selectedResult?.lng,
    searchRadius: search.selectedResult ? search.radius : undefined,
    comparing: comparison.comparing,
    refDow: comparison.referenceSlot?.dow,
    refHour: comparison.referenceSlot?.hour,
  });

  useEffect(() => {
    function handleUrlChange() {
      const state = getInitialUrlState();
      if (state.timeSlot) setSlot(state.timeSlot.dow, state.timeSlot.hour);

      if (state.blockId && blocks.length > 0) {
        const found = blocks.find((block) => block.id === state.blockId);
        if (found) setSelectedBlock(found);
      } else if (!state.blockId) {
        setSelectedBlock(null);
      }
    }

    window.addEventListener("urlstatechange", handleUrlChange);
    return () => window.removeEventListener("urlstatechange", handleUrlChange);
  }, [blocks, setSlot]);

  const handleBlockClick = useCallback(
    (block: BlockData | null) => {
      setSelectedBlock(block);
      if (block) flyTo(block.lng, block.lat);
    },
    [flyTo],
  );

  const handleSearchSelect = useCallback(
    (result: { lat: number; lng: number; name: string; type: string }) => {
      search.selectResult(result);
      flyTo(result.lng, result.lat, 15);
    },
    [flyTo, search],
  );

  const searchExtraLayers = useMemo(() => {
    if (!search.selectedResult) return [];
    return [
      createRadiusOverlayLayer(
        { lat: search.selectedResult.lat, lng: search.selectedResult.lng },
        search.radius,
      ),
    ];
  }, [search.radius, search.selectedResult]);

  const handleWeekCellClick = useCallback(
    (dow: number, hour: number) => {
      setSlot(dow, hour);
    },
    [setSlot],
  );

  if (error) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="mb-2 text-lg text-red-400">Park verileri yüklenemedi</p>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="mt-4 text-xs text-gray-600">
            Veri oluşturmak için <code className="rounded bg-gray-800 px-1.5 py-0.5">python3 scripts/fetch_ispark_data.py</code> çalıştırın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-gray-950">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold">
              İstanbul Park <span className="font-light text-gray-400">Isı Haritası</span>
            </h1>
            <p className="text-sm text-gray-500">Park verileri yükleniyor...</p>
          </div>
        </div>
      )}

      <ParkingMap
        blocks={blocks}
        timeSlot={timeSlot}
        selectedBlockId={selectedBlock?.id ?? null}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        onBlockClick={handleBlockClick}
        extraLayers={searchExtraLayers}
        comparing={comparison.comparing}
        referenceSlot={comparison.referenceSlot}
        columnStyle={columnStyle}
      />

      <SearchBar
        query={search.query}
        results={search.results}
        isSearching={search.isSearching}
        radius={search.radius}
        hasSelection={search.selectedResult !== null}
        onQueryChange={search.setQuery}
        onSelectResult={handleSearchSelect}
        onClear={search.clearSearch}
        onRadiusChange={search.setRadius}
      />

      <IsochroneControl
        blocks={blocks}
        timeSlot={timeSlot}
      />

      {search.selectedResult && (
        <SearchResults
          blocks={search.nearbyBlocks}
          timeSlot={timeSlot}
          onBlockClick={handleBlockClick}
        />
      )}

      <Header generated={generated} />

      <WeekHeatmap
        cityAverages={cityAverages}
        cityEnforcedFraction={cityEnforcedFraction}
        timeSlot={timeSlot}
        onCellClick={handleWeekCellClick}
      />

      <Legend
        is3D={viewState.zoom >= COLUMN_ZOOM_MIN && viewState.zoom < SCATTER_ZOOM_MIN}
        comparing={comparison.comparing}
        columnStyle={columnStyle}
        onColumnStyleChange={setColumnStyle}
      />

      {comparison.comparing && viewState.zoom < COLUMN_ZOOM_MIN && (
        <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-[11px] text-purple-300">
          Fark görünümü için yakınlaştırın
        </div>
      )}

      <TimeControl
        timeSlot={timeSlot}
        isPlaying={isPlaying}
        speed={speed}
        onDowChange={setDow}
        onHourChange={setHour}
        onTogglePlay={togglePlay}
        onSpeedChange={setSpeed}
        mobilePanel={(
          <MobileInsightsPanel
            cityAverages={cityAverages}
            cityEnforcedFraction={cityEnforcedFraction}
            timeSlot={timeSlot}
            onCellClick={handleWeekCellClick}
            comparing={comparison.comparing}
            is3D={viewState.zoom >= COLUMN_ZOOM_MIN && viewState.zoom < SCATTER_ZOOM_MIN}
            columnStyle={columnStyle}
            onColumnStyleChange={setColumnStyle}
          />
        )}
      >
        <ComparisonControl
          comparing={comparison.comparing}
          referenceSlot={comparison.referenceSlot}
          currentSlot={timeSlot}
          onPin={() => comparison.pinReference(timeSlot)}
          onExit={comparison.exitComparison}
        />
      </TimeControl>

      <BlockDetailPanel
        block={selectedBlock}
        timeSlot={timeSlot}
        onClose={() => setSelectedBlock(null)}
        comparing={comparison.comparing}
        referenceSlot={comparison.referenceSlot}
      />
    </div>
  );
}

export default App;
