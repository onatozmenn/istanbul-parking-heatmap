import { describe, it, expect } from "vitest";
import { getTimeSlotIndex, getOccupancy, isEnforced, isEnforcedAt, getDataSource, computeAllCityAverages } from "../lib/occupancy";
import type { BlockData } from "../types";

function makeBlock(overrides: Partial<BlockData> = {}): BlockData {
  const slots = new Array(168).fill(0);
  return {
    id: "TEST-1",
    lat: 41.0,
    lng: 29.0,
    meters: 10,
    street: "Test Sokak",
    hood: "Test",
    slots,
    ...overrides,
  };
}

describe("getTimeSlotIndex", () => {
  it("returns 0 for Monday 00:00", () => {
    expect(getTimeSlotIndex(0, 0)).toBe(0);
  });

  it("returns correct index for Wednesday 14:00", () => {
    expect(getTimeSlotIndex(2, 14)).toBe(2 * 24 + 14);
  });

  it("returns 167 for Sunday 23:00", () => {
    expect(getTimeSlotIndex(6, 23)).toBe(167);
  });
});

describe("getOccupancy", () => {
  it("returns occupancy value at correct slot", () => {
    const slots = new Array(168).fill(0);
    slots[getTimeSlotIndex(1, 10)] = 0.75;
    const block = makeBlock({ slots });
    expect(getOccupancy(block, { dow: 1, hour: 10 })).toBe(0.75);
  });

  it("returns 0 for empty slot", () => {
    const block = makeBlock();
    expect(getOccupancy(block, { dow: 3, hour: 15 })).toBe(0);
  });
});

describe("isEnforced", () => {
  it("returns true when no enforced array (assumes enforced)", () => {
    const block = makeBlock({ enforced: undefined });
    expect(isEnforced(block, { dow: 0, hour: 10 })).toBe(true);
  });

  it("returns true when enforced[slot] is 1", () => {
    const enforced = new Array(168).fill(0);
    enforced[getTimeSlotIndex(0, 10)] = 1;
    const block = makeBlock({ enforced });
    expect(isEnforced(block, { dow: 0, hour: 10 })).toBe(true);
  });

  it("returns false when enforced[slot] is 0", () => {
    const enforced = new Array(168).fill(0);
    const block = makeBlock({ enforced });
    expect(isEnforced(block, { dow: 0, hour: 10 })).toBe(false);
  });
});

describe("isEnforcedAt", () => {
  it("works with direct slot index", () => {
    const enforced = new Array(168).fill(1);
    enforced[50] = 0;
    const block = makeBlock({ enforced });
    expect(isEnforcedAt(block, 50)).toBe(false);
    expect(isEnforcedAt(block, 51)).toBe(true);
  });
});

describe("getDataSource", () => {
  it("returns 'meter' for enforced slot with data", () => {
    const enforced = new Array(168).fill(1);
    const slots = new Array(168).fill(0.5);
    const block = makeBlock({ enforced, slots });
    expect(getDataSource(block, { dow: 0, hour: 0 })).toBe("meter");
  });

  it("returns 'none' for enforced slot without data", () => {
    const enforced = new Array(168).fill(1);
    const block = makeBlock({ enforced });
    expect(getDataSource(block, { dow: 0, hour: 0 })).toBe("none");
  });

  it("returns 'pressure' for non-enforced slot with data", () => {
    const enforced = new Array(168).fill(0);
    const slots = new Array(168).fill(0.3);
    const block = makeBlock({ enforced, slots });
    expect(getDataSource(block, { dow: 0, hour: 0 })).toBe("pressure");
  });
});

describe("computeAllCityAverages", () => {
  it("computes averages across blocks", () => {
    const slots1 = new Array(168).fill(0.6);
    const slots2 = new Array(168).fill(0.4);
    const blocks = [makeBlock({ slots: slots1 }), makeBlock({ slots: slots2 })];
    const avgs = computeAllCityAverages(blocks);
    expect(avgs.length).toBe(168);
    expect(avgs[0]).toBeCloseTo(0.5, 5);
  });

  it("ignores zero-value slots in average", () => {
    const slots1 = new Array(168).fill(0.8);
    const slots2 = new Array(168).fill(0);
    const blocks = [makeBlock({ slots: slots1 }), makeBlock({ slots: slots2 })];
    const avgs = computeAllCityAverages(blocks);
    expect(avgs[0]).toBeCloseTo(0.8, 5);
  });

  it("returns 0 for all-zero blocks", () => {
    const blocks = [makeBlock(), makeBlock()];
    const avgs = computeAllCityAverages(blocks);
    expect(avgs[0]).toBe(0);
  });
});
