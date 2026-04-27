import { describe, expect, it } from "vitest";

import {
  getEmail,
  getPassword,
  getPasswordRequirementStatuses,
  getSeniorDateOfBirth,
  getTimeArray,
  getWeekdayArray,
} from "@/lib/validation";

describe("input validation", () => {
  it("accepts normalized emails and rejects malformed emails", () => {
    expect(getEmail(" Patient.Example@MEDIC.local ")).toBe(
      "patient.example@medic.local",
    );
    expect(() => getEmail("not-an-email")).toThrow(/valid email/i);
  });

  it("requires senior patients to be over 50", () => {
    expect(getSeniorDateOfBirth("1958-09-07")).toBe("1958-09-07");
    expect(() => getSeniorDateOfBirth("1990-01-01")).toThrow(/over 50/i);
  });

  it("requires strong passwords for new accounts", () => {
    expect(getPassword("MedicPass123!")).toBe("MedicPass123!");
    expect(() => getPassword("medicpass")).toThrow(/uppercase letter.*number.*symbol/i);
    expect(getPasswordRequirementStatuses("MedicPass123!").every(({ isMet }) => isMet)).toBe(
      true,
    );
  });

  it("normalizes weekday and time arrays", () => {
    expect(getWeekdayArray(["monday", "Wed", "fri"])).toEqual([
      "Mon",
      "Wed",
      "Fri",
    ]);
    expect(getTimeArray(["20:00", "08:30", "08:30"])).toEqual([
      "08:30",
      "20:00",
    ]);
  });
});
