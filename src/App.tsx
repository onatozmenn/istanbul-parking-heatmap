import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlockData } from "./types";
import type { GeoResult } from "./lib/geocode";
import type { ColumnStyle } from "./layers/parkingColumnLayer";
import { COLUMN_ZOOM_MIN, SCATTER_ZOOM_MIN } from "./lib/constants";
import { useParkingData } from "./hooks/useParkingData";
import { useTimeSlot } from "./hooks/useTimeSlot";
import { useMapView } from "./hooks/useMapView";
import { getInitialUrlState, useUrlSync } from "./hooks/useUrlState";
import { useSearch } from "./hooks/useSearch";
import { useComparison } from "./hooks/useComparison";
import { useDesktopViewport } from "./hooks/useDesktopViewport";
import { createRadiusOverlayLayer } from "./layers/radiusOverlayLayer";
import { ParkingMap } from "./components/ParkingMap";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { WeekHeatmap } from "./components/WeekHeatmap";
import { Legend } from "./components/Legend";
import { TimeControl } from "./components/TimeControl";
import { ComparisonControl } from "./components/ComparisonControl";
import { BlockDetailPanel } from "./components/BlockDetailPanel";
import { MobileInsightsPanel } from "./components/MobileInsightsPanel";
import { HotspotPanel } from "./components/HotspotPanel";

const urlInit = getInitialUrlState();

function createUrlSearchResult(lat?: number | null, lng?: number | null): GeoResult | null {
  if (lat == null || lng == null) return null;
  return { lat, lng, name: "Paylaşılan konum", type: "koordinat" };
}

function App() {
  const { blocks, cityAverages, cityEnforcedFraction, loading, error, generated } = useParkingData();
  const isDesktop = useDesktopViewport();
  const { timeSlot, isPlaying, speed, setDow, setHour, setSlot, setSpeed, togglePlay } =
    useTimeSlot(urlInit.timeSlot);
  const { viewState, onViewStateChange, flyTo, restoreViewState } = useMapView(urlInit.viewState);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(urlInit.blockId ?? null);
  const [columnStyle, setColumnStyle] = useState<ColumnStyle>("columns");

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  const search = useSearch(blocks, timeSlot, {
    initialResult: createUrlSearchResult(urlInit.searchLat, urlInit.searchLng),
    initialRadius: urlInit.searchRadius,
  });
  const comparison = useComparison(urlInit.comparing, urlInit.refDow, urlInit.refHour);
  const restoreSearch = search.restoreSearch;
  const restoreComparison = comparison.restoreComparison;

  useUrlSync({
    timeSlot,
    viewState,
    selectedBlockId,
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
      if (state.viewState) restoreViewState(state.viewState);
      setSelectedBlockId(state.blockId ?? null);
      restoreSearch(
        createUrlSearchResult(state.searchLat, state.searchLng),
        state.searchRadius,
      );
      restoreComparison(state.comparing ?? false, state.refDow, state.refHour);
    }

    window.addEventListener("urlstatechange", handleUrlChange);
    return () => window.removeEventListener("urlstatechange", handleUrlChange);
  }, [
    setSlot,
    restoreViewState,
    restoreSearch,
    restoreComparison,
  ]);

  const handleBlockClick = useCallback(
    (block: BlockData | null) => {
      setSelectedBlockId(block?.id ?? null);
      if (block) flyTo(block.lng, block.lat);
    },
    [flyTo],
  );

  function handleSearchSelect(result: GeoResult) {
    search.selectResult(result);
    flyTo(result.lng, result.lat, 15);
  }

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
        selectedBlockId={selectedBlockId}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        onBlockClick={handleBlockClick}
        extraLayers={searchExtraLayers}
        comparing={comparison.comparing}
        referenceSlot={comparison.referenceSlot}
        columnStyle={columnStyle}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] lg:px-4">
        <div className="mx-auto grid max-w-[100rem] grid-cols-1 gap-2 md:grid-cols-[minmax(14rem,0.8fr)_minmax(24rem,1.5fr)] lg:grid-cols-[minmax(13rem,1fr)_minmax(25rem,31rem)_minmax(13rem,1fr)] lg:items-start lg:gap-3">
          <Header generated={generated} />

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

          <div className="pointer-events-none flex flex-col items-end gap-2 md:col-span-2 lg:col-span-1">
            {isDesktop && (
              <div className="pointer-events-auto w-full xl:w-80">
                <HotspotPanel blocks={blocks} timeSlot={timeSlot} className="w-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      {search.selectedResult && (
        <SearchResults
          blocks={search.nearbyBlocks}
          timeSlot={timeSlot}
          onBlockClick={handleBlockClick}
        />
      )}

      {isDesktop && (
        <>
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
        </>
      )}

      {comparison.comparing && viewState.zoom < COLUMN_ZOOM_MIN && (
        <div className="pointer-events-none absolute left-1/2 top-44 z-20 -translate-x-1/2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-center text-[11px] text-purple-300 lg:top-24">
          Fark görünümü için yakınlaştırın
        </div>
      )}

      <TimeControl
        isDesktop={isDesktop}
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
        onClose={() => setSelectedBlockId(null)}
        comparing={comparison.comparing}
        referenceSlot={comparison.referenceSlot}
      />
    </div>
  );
}

export default App;
