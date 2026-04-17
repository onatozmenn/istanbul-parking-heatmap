import { describe, it, expect } from "vitest";
import { dayName, formatHour, formatOccupancy, formatTimeSlot } from "../lib/format";

describe("dayName", () => {
  it("returns Turkish day names", () => {
    expect(dayName(0)).toBe("Pzt");
    expect(dayName(6)).toBe("Paz");
  });
});

describe("formatHour", () => {
  it("formats midnight", () => {
    expect(formatHour(0)).toContain("0");
  });

  it("formats noon", () => {
    expect(formatHour(12)).toContain("12");
  });
});

describe("formatOccupancy", () => {
  it("formats percentage", () => {
    const result = formatOccupancy(0.75);
    expect(result).toContain("75");
  });

  it("handles free parking when not enforced", () => {
    const result = formatOccupancy(0, false);
    expect(result.toLowerCase()).toContain("ücretsiz");
  });
});

describe("formatTimeSlot", () => {
  it("combines day and hour", () => {
    const result = formatTimeSlot(0, 14);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});
