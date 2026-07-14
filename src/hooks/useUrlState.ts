import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import type { MapViewState } from "@deck.gl/core";
import type { TimeSlot } from "../types";

/** URL hash keys */
interface UrlParams {
  dow: number;
  hour: number;
  z: number;
  lat: number;
  lng: number;
  p: number; // pitch
  b: number; // bearing
  block: string | null;
  // Search params (Feature 4)
  slat: number | null;
  slng: number | null;
  sr: number | null;
  // Comparison params (Feature 3)
  cmp: number | null;
  rdow: number | null;
  rhour: number | null;
}

function parseHash(value: string): Partial<UrlParams> {
  const hash = value.startsWith("#") ? value.slice(1) : value;
  if (!hash) return {};

  const params: Partial<UrlParams> = {};
  for (const pair of hash.split("&")) {
    const [key, val] = pair.split("=");
    if (!key || val === undefined) continue;

    switch (key) {
      case "dow": params.dow = parseInt(val); break;
      case "hour": params.hour = parseInt(val); break;
      case "z": params.z = parseFloat(val); break;
      case "lat": params.lat = parseFloat(val); break;
      case "lng": params.lng = parseFloat(val); break;
      case "p": params.p = parseFloat(val); break;
      case "b": params.b = parseFloat(val); break;
      case "block": params.block = decodeURIComponent(val); break;
      case "slat": params.slat = parseFloat(val); break;
      case "slng": params.slng = parseFloat(val); break;
      case "sr": params.sr = parseInt(val); break;
      case "cmp": params.cmp = parseInt(val); break;
      case "rdow": params.rdow = parseInt(val); break;
      case "rhour": params.rhour = parseInt(val); break;
    }
  }
  return params;
}

function buildHash(params: UrlParams): string {
  const parts: string[] = [];
  parts.push(`dow=${params.dow}`);
  parts.push(`hour=${params.hour}`);
  parts.push(`z=${params.z.toFixed(2)}`);
  parts.push(`lat=${params.lat.toFixed(5)}`);
  parts.push(`lng=${params.lng.toFixed(5)}`);
  if (params.p !== 0) parts.push(`p=${params.p.toFixed(1)}`);
  if (params.b !== 0) parts.push(`b=${params.b.toFixed(1)}`);
  if (params.block) parts.push(`block=${encodeURIComponent(params.block)}`);
  if (params.slat != null && params.slng != null) {
    parts.push(`slat=${params.slat.toFixed(5)}`);
    parts.push(`slng=${params.slng.toFixed(5)}`);
    if (params.sr != null) parts.push(`sr=${params.sr}`);
  }
  if (params.cmp === 1) {
    parts.push(`cmp=1`);
    if (params.rdow != null) parts.push(`rdow=${params.rdow}`);
    if (params.rhour != null) parts.push(`rhour=${params.rhour}`);
  }

  return "#" + parts.join("&");
}

export interface UrlStateInitial {
  timeSlot?: TimeSlot;
  viewState?: Partial<MapViewState>;
  blockId?: string | null;
  searchLat?: number | null;
  searchLng?: number | null;
  searchRadius?: number | null;
  comparing?: boolean;
  refDow?: number | null;
  refHour?: number | null;
}

/** Clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Validate a number is finite and within optional range */
function validNum(v: number | null | undefined, min?: number, max?: number): number | undefined {
  if (v === undefined || v === null || !Number.isFinite(v)) return undefined;
  if (min !== undefined && max !== undefined) return clamp(v, min, max);
  return v;
}

/** Parse initial state from URL on mount */
export function getInitialUrlState(hash = window.location.hash): UrlStateInitial {
  const p = parseHash(hash);
  const result: UrlStateInitial = {};

  const dow = validNum(p.dow, 0, 6);
  const hour = validNum(p.hour, 0, 23);
  if (dow !== undefined && hour !== undefined) {
    result.timeSlot = { dow, hour };
  }

  const lat = validNum(p.lat, -90, 90);
  const lng = validNum(p.lng, -180, 180);
  const z = validNum(p.z, 0, 22);
  if (lat !== undefined && lng !== undefined && z !== undefined) {
    const vs: Partial<MapViewState> = {
      latitude: lat,
      longitude: lng,
      zoom: z,
    };
    const pitch = validNum(p.p, 0, 85);
    if (pitch !== undefined) vs.pitch = pitch;
    const bearing = validNum(p.b, -180, 180);
    if (bearing !== undefined) vs.bearing = bearing;
    result.viewState = vs;
  }

  if (p.block && typeof p.block === "string" && p.block.length <= 200) {
    result.blockId = p.block;
  }

  const slat = validNum(p.slat, -90, 90);
  const slng = validNum(p.slng, -180, 180);
  if (slat !== undefined && slng !== undefined) {
    result.searchLat = slat;
    result.searchLng = slng;
    const sr = validNum(p.sr, 100, 2000);
    result.searchRadius = sr ?? 400;
  }

  if (p.cmp === 1) {
    result.comparing = true;
    result.refDow = validNum(p.rdow, 0, 6) ?? null;
    result.refHour = validNum(p.rhour, 0, 23) ?? null;
  }

  return result;
}

interface UrlSyncState {
  timeSlot: TimeSlot;
  viewState: MapViewState;
  selectedBlockId: string | null;
  isPlaying: boolean;
  searchLat?: number | null;
  searchLng?: number | null;
  searchRadius?: number | null;
  comparing?: boolean;
  refDow?: number | null;
  refHour?: number | null;
}

/**
 * Sync app state to URL hash. Debounces continuous changes (pan/zoom),
 * uses pushState for discrete changes (time slot, block selection).
 */
export function useUrlSync(state: UrlSyncState) {
  const debounceRef = useRef<number | null>(null);
  const lastHashRef = useRef(window.location.hash);
  const restoringRef = useRef(false);
  const [restoreTick, setRestoreTick] = useState(0);

  const hash = useMemo(() => buildHash({
    dow: state.timeSlot.dow,
    hour: state.timeSlot.hour,
    z: state.viewState.zoom,
    lat: state.viewState.latitude,
    lng: state.viewState.longitude,
    p: state.viewState.pitch ?? 0,
    b: state.viewState.bearing ?? 0,
    block: state.selectedBlockId,
    slat: state.searchLat ?? null,
    slng: state.searchLng ?? null,
    sr: state.searchRadius ?? null,
    cmp: state.comparing ? 1 : null,
    rdow: state.refDow ?? null,
    rhour: state.refHour ?? null,
  }), [
    state.timeSlot.dow, state.timeSlot.hour,
    state.viewState.zoom, state.viewState.latitude, state.viewState.longitude,
    state.viewState.pitch, state.viewState.bearing, state.selectedBlockId,
    state.searchLat, state.searchLng, state.searchRadius,
    state.comparing, state.refDow, state.refHour,
  ]);

  const viewSignature = `${state.viewState.zoom}|${state.viewState.latitude}|${state.viewState.longitude}|${state.viewState.pitch ?? 0}|${state.viewState.bearing ?? 0}`;
  const discreteSignature = `${state.timeSlot.dow}|${state.timeSlot.hour}|${state.selectedBlockId ?? ""}|${state.searchLat ?? ""}|${state.searchLng ?? ""}|${state.searchRadius ?? ""}|${state.comparing ? 1 : 0}|${state.refDow ?? ""}|${state.refHour ?? ""}`;

  const writeUrl = useCallback((nextHash: string, push: boolean) => {
    if (nextHash === lastHashRef.current && window.location.hash === nextHash) return;
    lastHashRef.current = nextHash;
    if (push) history.pushState(null, "", nextHash);
    else history.replaceState(null, "", nextHash);
  }, []);

  // Debounced URL update: replace for continuous, push for discrete
  useEffect(() => {
    if (state.isPlaying || restoringRef.current) return;

    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      writeUrl(hash, false);
    }, 300);

    return () => {
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [viewSignature, hash, writeUrl, state.isPlaying, restoreTick]);

  // Immediate pushState for discrete changes (time slot, block, search, comparison)
  const prevDiscreteRef = useRef(discreteSignature);

  useEffect(() => {
    const changed = prevDiscreteRef.current !== discreteSignature;
    prevDiscreteRef.current = discreteSignature;
    if (!changed || state.isPlaying || restoringRef.current) return;
    writeUrl(hash, true);
  }, [discreteSignature, hash, writeUrl, state.isPlaying, restoreTick]);

  useEffect(() => {
    restoringRef.current = false;
  }, [restoreTick, hash, viewSignature, discreteSignature]);

  // Handle popstate (browser back/forward)
  useEffect(() => {
    function handlePopstate() {
      restoringRef.current = true;
      lastHashRef.current = window.location.hash;
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
      window.dispatchEvent(new CustomEvent("urlstatechange"));
      setRestoreTick((value) => value + 1);
    }
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);
}
