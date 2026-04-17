import { useEffect, useRef, useCallback } from "react";
import type { MapViewState } from "deck.gl";
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
  // Isochrone params
  iso: number | null;
  imode: string | null;
  ilat: number | null;
  ilng: number | null;
  imax: number | null;

}

function parseHash(): Partial<UrlParams> {
  const hash = window.location.hash.slice(1);
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
      case "iso": params.iso = parseInt(val); break;
      case "imode": params.imode = val; break;
      case "ilat": params.ilat = parseFloat(val); break;
      case "ilng": params.ilng = parseFloat(val); break;
      case "imax": params.imax = parseInt(val); break;

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
  if (params.iso === 1) {
    parts.push(`iso=1`);
    if (params.imode) parts.push(`imode=${params.imode}`);
    if (params.ilat != null) parts.push(`ilat=${params.ilat.toFixed(5)}`);
    if (params.ilng != null) parts.push(`ilng=${params.ilng.toFixed(5)}`);
    if (params.imax != null && params.imax !== 20) parts.push(`imax=${params.imax}`);
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
  isoActive?: boolean;
  isoMode?: string | null;
  isoLat?: number | null;
  isoLng?: number | null;
  isoMaxMinutes?: number | null;

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
export function getInitialUrlState(): UrlStateInitial {
  const p = parseHash();
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

  if (p.iso === 1) {
    result.isoActive = true;
    const validModes = ["driving", "cycling", "walking"];
    result.isoMode = validModes.includes(p.imode ?? "") ? p.imode! : "driving";
    const ilat = validNum(p.ilat, -90, 90);
    const ilng = validNum(p.ilng, -180, 180);
    if (ilat !== undefined && ilng !== undefined) {
      result.isoLat = ilat;
      result.isoLng = ilng;
    }
    const imax = validNum(p.imax, 2, 20);
    if (imax !== undefined) {
      result.isoMaxMinutes = imax;
    }
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
  isoActive?: boolean;
  isoMode?: string | null;
  isoLat?: number | null;
  isoLng?: number | null;
  isoMaxMinutes?: number | null;

}

/**
 * Sync app state to URL hash. Debounces continuous changes (pan/zoom),
 * uses pushState for discrete changes (time slot, block selection).
 */
export function useUrlSync(state: UrlSyncState) {
  const debounceRef = useRef<number | null>(null);
  const prevHashRef = useRef<string>("");
  const sourceRef = useRef<"app" | "popstate">("app");

  const writeUrl = useCallback((push: boolean) => {
    const hash = buildHash({
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
      iso: state.isoActive ? 1 : null,
      imode: state.isoMode ?? null,
      ilat: state.isoLat ?? null,
      ilng: state.isoLng ?? null,
      imax: state.isoMaxMinutes ?? null,
    });

    if (hash === prevHashRef.current) return;
    prevHashRef.current = hash;

    if (push) {
      history.pushState(null, "", hash);
    } else {
      history.replaceState(null, "", hash);
    }
  }, [state]);

  // Debounced URL update: replace for continuous, push for discrete
  useEffect(() => {
    if (state.isPlaying) return; // suppress during playback
    if (sourceRef.current === "popstate") {
      sourceRef.current = "app";
      return;
    }

    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      writeUrl(false); // replaceState for debounced (pan/zoom)
    }, 300);

    return () => {
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state.viewState.zoom, state.viewState.latitude, state.viewState.longitude,
      state.viewState.pitch, state.viewState.bearing, writeUrl, state.isPlaying]);

  // Immediate pushState for discrete changes (time slot, block, search, comparison)
  const prevDiscreteRef = useRef({
    dow: state.timeSlot.dow,
    hour: state.timeSlot.hour,
    block: state.selectedBlockId,
    slat: state.searchLat,
    slng: state.searchLng,
    cmp: state.comparing,
    iso: state.isoActive,
    ilat: state.isoLat,
    ilng: state.isoLng,
    imax: state.isoMaxMinutes,
  });

  useEffect(() => {
    if (state.isPlaying) return;
    const prev = prevDiscreteRef.current;
    const changed =
      prev.dow !== state.timeSlot.dow ||
      prev.hour !== state.timeSlot.hour ||
      prev.block !== state.selectedBlockId ||
      prev.slat !== (state.searchLat ?? undefined) ||
      prev.slng !== (state.searchLng ?? undefined) ||
      prev.cmp !== (state.comparing ?? undefined) ||
      prev.iso !== (state.isoActive ?? undefined) ||
      prev.ilat !== (state.isoLat ?? undefined) ||
      prev.ilng !== (state.isoLng ?? undefined) ||
      prev.imax !== (state.isoMaxMinutes ?? undefined);

    if (changed) {
      prevDiscreteRef.current = {
        dow: state.timeSlot.dow,
        hour: state.timeSlot.hour,
        block: state.selectedBlockId,
        slat: state.searchLat,
        slng: state.searchLng,
        cmp: state.comparing,
        iso: state.isoActive,
        ilat: state.isoLat,
        ilng: state.isoLng,
        imax: state.isoMaxMinutes,
      };
      writeUrl(true);
    }
  }, [state.timeSlot.dow, state.timeSlot.hour, state.selectedBlockId,
      state.searchLat, state.searchLng, state.comparing,
      state.isoActive, state.isoLat, state.isoLng, state.isoMaxMinutes,
      writeUrl, state.isPlaying]);

  // Handle popstate (browser back/forward)
  useEffect(() => {
    function handlePopstate() {
      sourceRef.current = "popstate";
      // The caller should re-parse the URL state
      // We dispatch a custom event that App can listen to
      window.dispatchEvent(new CustomEvent("urlstatechange"));
    }
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);
}
