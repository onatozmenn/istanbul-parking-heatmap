import { describe, it, expect } from "vitest";
import { deltaToColor, deltaToCss, formatDelta } from "../lib/deltaColors";

describe("deltaToColor", () => {
  it("returns blue-ish for negative delta (less busy)", () => {
    const rgba = deltaToColor(-0.2, true);
    expect(rgba[2]).toBeGreaterThan(rgba[0]);
  });

  it("returns red-ish for positive delta (more busy)", () => {
    const rgba = deltaToColor(0.2, true);
    expect(rgba[0]).toBeGreaterThan(rgba[2]);
  });
});

describe("deltaToCss", () => {
  it("returns valid CSS string", () => {
    expect(deltaToCss(0.1, true)).toMatch(/^rgb/);
  });
});

describe("formatDelta", () => {
  it("shows + for positive", () => {
    expect(formatDelta(0.15)).toMatch(/^\+/);
  });

  it("shows - for negative", () => {
    expect(formatDelta(-0.15)).toMatch(/^-|^−/);
  });
});
