import { describe, it, expect } from "vitest";
import { toDateTimeLocalValue } from "@/lib/datetime";

describe("toDateTimeLocalValue", () => {
  it("formats in local time so datetime-local round-trips without shifting", () => {
    const local = new Date(2026, 10, 9, 9, 5); // 9 Nov 2026, 09:05 local
    const value = toDateTimeLocalValue(local);
    expect(value).toBe("2026-11-09T09:05");
    // Re-parsing the input value (what the form does on save) gives back the same instant.
    expect(new Date(value).getTime()).toBe(local.getTime());
  });

  it("accepts ISO strings from the API", () => {
    const iso = new Date(2026, 0, 2, 23, 59).toISOString();
    expect(toDateTimeLocalValue(iso)).toBe("2026-01-02T23:59");
  });

  it("returns an empty string for invalid input", () => {
    expect(toDateTimeLocalValue("not a date")).toBe("");
  });
});
