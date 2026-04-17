import { describe, it, expect } from "vitest";
import { occupancyToRgb, occupancyToColor, occupancyToCss, occupancyLabel } from "../lib/colors";

describe("occupancyToRgb", () => {
  it("returns green-ish for low occupancy", () => {
    const rgb = occupancyToRgb(0.2);
    expect(rgb[1]).toBeGreaterThan(rgb[0]); // green should dominate
  });

  it("returns red-ish for high occupancy", () => {
    const rgb = occupancyToRgb(0.95);
    expect(rgb[0]).toBeGreaterThan(rgb[1]); // red should dominate
  });
});

describe("occupancyToColor", () => {
  it("returns blue for free parking (not enforced, no data)", () => {
    const rgba = occupancyToColor(0, false);
    expect(rgba[2]).toBeGreaterThan(rgba[0]);
    expect(rgba[2]).toBeGreaterThan(rgba[1]);
  });
});

describe("occupancyToCss", () => {
  it("returns a valid CSS color string", () => {
    const css = occupancyToCss(0.5);
    expect(css).toMatch(/^rgb/);
  });
});

describe("occupancyLabel", () => {
  it("returns 'Müsait' for low occupancy", () => {
    expect(occupancyLabel(0.3)).toContain("Müsait");
  });

  it("returns 'Zor' for high occupancy", () => {
    expect(occupancyLabel(0.9)).toContain("Zor");
  });
});
