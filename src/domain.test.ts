import { describe, expect, it } from "vitest";
import {
  calculateProgress,
  deadlineDays,
  defaults,
  emptyProgress,
  filterParticipants,
  initialFilters,
  participantSchema,
  tasks,
  validateFile,
  validateSpreadsheetUrl,
  type Participant,
} from "./domain";
describe("calculateProgress", () => {
  it.each([0, 1, 2, 3])("rounds %i completed tasks", (count) => {
    const p = emptyProgress();
    tasks.slice(0, count).forEach((t) => (p[t].status = true));
    expect(calculateProgress(p)).toBe([0, 33, 67, 100][count]);
  });
});
describe("deadlines in Jakarta", () => {
  it("handles timezone and partial days", () => {
    expect(
      deadlineDays(
        defaults.WEBSITE_DEADLINE,
        new Date("2026-09-19T00:00:00+07:00"),
      ),
    ).toBe(0);
  });
  it("returns negative after deadline", () =>
    expect(
      deadlineDays(
        defaults.WEBSITE_DEADLINE,
        new Date("2026-09-20T00:00:00+07:00"),
      ),
    ).toBe(-1));
  it("keeps elapsed deadlines negative", () =>
    expect(
      deadlineDays(
        defaults.WEBSITE_DEADLINE,
        new Date("2026-09-22T00:00:00+07:00"),
      ),
    ).toBeLessThan(0));
});
describe("participant validation", () => {
  it("trims input", () =>
    expect(
      participantSchema.parse({ name: " Ayu ", institution: " SDN Sadeng 02 " })
        .name,
    ).toBe("Ayu"));
  it("rejects blank or excessive input", () => {
    expect(
      participantSchema.safeParse({ name: " ", institution: "SDN" }).success,
    ).toBe(false);
    expect(
      participantSchema.safeParse({ name: "A".repeat(121), institution: "SDN" })
        .success,
    ).toBe(false);
  });
});
describe("combined filters", () => {
  const p: Participant = {
    participant_id: "fixed-id",
    name: "Ayu Kusumadyastuti",
    institution: "SDN Sadeng 02",
    is_active: true,
    progress: emptyProgress(),
  };
  p.progress.WEBSITE.status = true;
  it("matches case insensitive name and institution", () => {
    expect(
      filterParticipants([p], { ...initialFilters, search: "AYU" }),
    ).toHaveLength(1);
    expect(
      filterParticipants([p], { ...initialFilters, search: "sadeng 02" }),
    ).toHaveLength(1);
  });
  it("combines task, institution and completion filters", () => {
    expect(
      filterParticipants([p], {
        ...initialFilters,
        institution: p.institution,
        WEBSITE: "true",
        VIDEO: "false",
        completion: "incomplete",
      }),
    ).toHaveLength(1);
    expect(
      filterParticipants([p], {
        ...initialFilters,
        WEBSITE: "true",
        VIDEO: "true",
      }),
    ).toHaveLength(0);
  });
  it("excludes inactive participants", () =>
    expect(
      filterParticipants([{ ...p, is_active: false }], initialFilters),
    ).toHaveLength(0));
});
describe("file validation", () => {
  it.each(["scores.xlsx", "scores.XLS", "scores.csv"])("accepts %s", (name) =>
    expect(validateFile({ name, size: 100 })).toBeNull(),
  );
  it("rejects wrong extension, empty file and oversized upload", () => {
    expect(validateFile({ name: "scores.pdf", size: 100 })).toBeTruthy();
    expect(validateFile({ name: "scores.csv", size: 0 })).toBeTruthy();
    expect(
      validateFile({ name: "scores.xlsx", size: 10 * 1024 * 1024 + 1 }),
    ).toBeTruthy();
    expect(
      validateFile({ name: "scores.xlsx", size: 10 * 1024 * 1024 }),
    ).toBeNull();
  });
  it("rejects lookalike spreadsheet hosts", () => {
    expect(
      validateSpreadsheetUrl(
        "https://docs.google.com.evil.com/spreadsheets/d/abc",
      ),
    ).toBe(false);
    expect(
      validateSpreadsheetUrl("https://docs.google.com/spreadsheets/d/abc/edit"),
    ).toBe(true);
    expect(validateSpreadsheetUrl("")).toBe(true);
  });
});
