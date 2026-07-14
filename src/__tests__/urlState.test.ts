import { describe, expect, it } from "vitest";
import { getInitialUrlState } from "../hooks/useUrlState";

describe("getInitialUrlState", () => {
  it("parses map, search, and comparison state", () => {
    const state = getInitialUrlState(
      "#dow=4&hour=18&z=14.5&lat=41.01&lng=29.02&p=35&b=-12" +
      "&block=ISPARK-42&slat=41.02&slng=29.03&sr=600" +
      "&cmp=1&rdow=1&rhour=9",
    );

    expect(state.timeSlot).toEqual({ dow: 4, hour: 18 });
    expect(state.viewState).toMatchObject({
      zoom: 14.5,
      latitude: 41.01,
      longitude: 29.02,
      pitch: 35,
      bearing: -12,
    });
    expect(state.blockId).toBe("ISPARK-42");
    expect(state.searchLat).toBe(41.02);
    expect(state.searchLng).toBe(29.03);
    expect(state.searchRadius).toBe(600);
    expect(state.comparing).toBe(true);
    expect(state.refDow).toBe(1);
    expect(state.refHour).toBe(9);
  });

  it("clamps numeric values", () => {
    const state = getInitialUrlState(
      "dow=-4&hour=99&z=50&lat=120&lng=-250&p=100&b=300",
    );

    expect(state.timeSlot).toEqual({ dow: 0, hour: 23 });
    expect(state.viewState).toMatchObject({
      zoom: 22,
      latitude: 90,
      longitude: -180,
      pitch: 85,
      bearing: 180,
    });
  });

  it("ignores incomplete coordinate groups", () => {
    const state = getInitialUrlState("#dow=2&slat=41.01&z=12&lat=41.0");

    expect(state.timeSlot).toBeUndefined();
    expect(state.viewState).toBeUndefined();
    expect(state.searchLat).toBeUndefined();
  });
});