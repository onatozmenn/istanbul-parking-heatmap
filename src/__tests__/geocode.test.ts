import { describe, it, expect } from "vitest";
import { haversineMeters } from "../lib/geocode";

describe("haversineMeters", () => {
  it("returns 0 for same point", () => {
    expect(haversineMeters(41.0, 29.0, 41.0, 29.0)).toBe(0);
  });

  it("returns approximately correct distance for known points", () => {
    // Taksim to Kadıköy: ~6.5 km
    const dist = haversineMeters(41.0370, 28.9850, 40.9903, 29.0282);
    expect(dist).toBeGreaterThan(5000);
    expect(dist).toBeLessThan(8000);
  });

  it("is symmetric", () => {
    const d1 = haversineMeters(41.0, 29.0, 41.05, 29.05);
    const d2 = haversineMeters(41.05, 29.05, 41.0, 29.0);
    expect(d1).toBeCloseTo(d2, 5);
  });
});
