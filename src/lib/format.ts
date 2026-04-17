const DAY_NAMES = ["Pzt", "Sal", "\u00C7ar", "Per", "Cum", "Cmt", "Paz"] as const;
const DAY_NAMES_FULL = [
  "Pazartesi", "Sal\u0131", "\u00C7ar\u015Famba", "Per\u015Fembe", "Cuma", "Cumartesi", "Pazar",
] as const;

/** Short day name from ISO dow (0=Mon..6=Sun) */
export function dayName(dow: number): string {
  return DAY_NAMES[dow] ?? "?";
}

/** Full day name from ISO dow */
export function dayNameFull(dow: number): string {
  return DAY_NAMES_FULL[dow] ?? "?";
}

/** Format hour as "09:00", "14:00", etc. */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/** Format occupancy as percentage string */
export function formatOccupancy(occupancy: number, enforced = true): string {
  if (occupancy <= 0) return enforced ? "N/A" : "\u00DCcretsiz";
  return `${Math.round(occupancy * 100)}%`;
}

/** Format time slot as "Çarşamba 14:00" */
export function formatTimeSlot(dow: number, hour: number): string {
  return `${dayNameFull(dow)} ${formatHour(hour)}`;
}
