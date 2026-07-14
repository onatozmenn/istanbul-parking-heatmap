import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { BlockData, TimeSlot } from "../types";
import { geocode, haversineMeters, type GeoResult } from "../lib/geocode";
import { getTimeSlotIndex } from "../lib/occupancy";

const RADIUS_OPTIONS = [200, 400, 600, 800] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];
export { RADIUS_OPTIONS };

export interface SearchState {
  query: string;
  results: GeoResult[];
  selectedResult: GeoResult | null;
  radius: RadiusOption;
  isSearching: boolean;
  nearbyBlocks: BlockData[];
}

interface UseSearchOptions {
  initialResult?: GeoResult | null;
  initialRadius?: number | null;
}

function normalizeRadius(radius?: number | null): RadiusOption {
  return RADIUS_OPTIONS.find((option) => option === radius) ?? 400;
}

export function useSearch(
  blocks: BlockData[],
  timeSlot: TimeSlot,
  options: UseSearchOptions = {},
) {
  const [query, setQuery] = useState(options.initialResult?.name ?? "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeoResult | null>(
    options.initialResult ?? null,
  );
  const [radius, setRadius] = useState<RadiusOption>(() =>
    normalizeRadius(options.initialRadius),
  );
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  // Debounced geocoding
  const handleQueryChange = useCallback((q: string) => {
    const requestId = ++requestIdRef.current;
    setQuery(q);
    if (debounceRef.current != null) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const nextResults = await geocode(q);
        if (requestId === requestIdRef.current) setResults(nextResults);
      } catch {
        if (requestId === requestIdRef.current) setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setIsSearching(false);
      }
    }, 300);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
    };
  }, []);

  // Blocks within radius of selected result, sorted by occupancy (lowest first)
  const nearbyBlocks = useMemo(() => {
    if (!selectedResult) return [];
    const slotIdx = getTimeSlotIndex(timeSlot.dow, timeSlot.hour);
    return blocks
      .filter((b) => {
        const dist = haversineMeters(selectedResult.lat, selectedResult.lng, b.lat, b.lng);
        return dist <= radius;
      })
      .sort((a, b) => (a.slots[slotIdx] ?? 0) - (b.slots[slotIdx] ?? 0))
      .slice(0, 15);
  }, [selectedResult, radius, blocks, timeSlot]);

  const selectResult = useCallback((result: GeoResult) => {
    requestIdRef.current++;
    setSelectedResult(result);
    setResults([]);
    setQuery(result.name);
    setIsSearching(false);
  }, []);

  const clearSearch = useCallback(() => {
    requestIdRef.current++;
    if (debounceRef.current != null) clearTimeout(debounceRef.current);
    setQuery("");
    setResults([]);
    setSelectedResult(null);
    setIsSearching(false);
  }, []);

  const restoreSearch = useCallback((result: GeoResult | null, nextRadius?: number | null) => {
    requestIdRef.current++;
    if (debounceRef.current != null) clearTimeout(debounceRef.current);
    setQuery(result?.name ?? "");
    setResults([]);
    setSelectedResult(result);
    setRadius(normalizeRadius(nextRadius));
    setIsSearching(false);
  }, []);

  return {
    query,
    results,
    selectedResult,
    radius,
    isSearching,
    nearbyBlocks,
    setQuery: handleQueryChange,
    setRadius,
    selectResult,
    clearSearch,
    restoreSearch,
  };
}
