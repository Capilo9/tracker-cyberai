import { describe, it, expect } from "vitest";
import { parseCsv, parsePublishedSheet, validateSheetUrl } from "./sheets";
import { demoSnapshot } from "./demo";
const header = "participant_id,name,institution,website,video,prepost\n";
describe("public sheet reader", () => {
  it("reads BOM, quoted commas, escaped quotes and embedded newlines", () => {
    expect(parseCsv('\uFEFFid,name\r\np01,"Ayu, ""Guru""\nSDN"\r\n')).toEqual([
      ["id", "name"],
      ["p01", 'Ayu, "Guru"\nSDN'],
    ]);
  });
  it("parses checkbox and Indonesian statuses without changing source data", () => {
    const data = parsePublishedSheet(
      header + "p01,Ayu,SDN Sadeng 02,TRUE,BELUM,sudah",
    );
    expect(data.participants[0].progress.WEBSITE.status).toBe(true);
    expect(data.participants[0].progress.VIDEO.status).toBe(false);
    expect(data.participants[0].progress.PREPOST.status).toBe(true);
  });
  it("accepts reordered columns", () => {
    expect(
      parsePublishedSheet(
        "name,participant_id,institution,prepost,video,website\nAyu,p01,SDN,1,0,1",
      ).participants[0].name,
    ).toBe("Ayu");
  });
  it("rejects malformed quoting, duplicate IDs and unknown statuses", () => {
    expect(() => parseCsv('"unfinished')).toThrow();
    expect(() => parseCsv('"done"invalid')).toThrow();
    expect(() => parsePublishedSheet(header + "p01,Ayu,SDN,yes,0,0")).toThrow(
      /Status/,
    );
    expect(() =>
      parsePublishedSheet(header + "p01,Ayu,SDN,0,0,0\np01,Budi,SDN,0,0,0"),
    ).toThrow(/duplikat/);
  });
  it("rejects missing headers, fields, mismatched columns and excess participants", () => {
    expect(() => parsePublishedSheet("name\nAyu")).toThrow(/Header/);
    expect(() => parsePublishedSheet(header + "p01,,SDN,0,0,0")).toThrow(
      /wajib/,
    );
    expect(() => parsePublishedSheet(header + "p01,Ayu,SDN,0")).toThrow(
      /kolom/,
    );
    expect(() =>
      parsePublishedSheet(
        header +
          Array.from(
            { length: 31 },
            (_, i) => `p${i},Peserta ${i},SDN,0,0,0`,
          ).join("\n"),
      ),
    ).toThrow(/30/);
  });
  it("does not invent participants when the published sheet has only a header", () =>
    expect(parsePublishedSheet(header).participants).toEqual([]));
  it("allows only Google published CSV or Apps Script deployment links", () => {
    expect(
      validateSheetUrl(
        "https://script.google.com/macros/s/DEPLOYMENT_EXAMPLE/exec",
      ),
    ).toContain("/exec");
    expect(() =>
      validateSheetUrl(
        "https://script.google.com/macros/s/DEPLOYMENT_EXAMPLE/dev",
      ),
    ).toThrow();
    expect(
      validateSheetUrl(
        "https://docs.google.com/spreadsheets/d/e/EXAMPLE/pub?gid=0&single=true&output=csv",
      ),
    ).toContain("output=csv");
    for (const url of [
      "https://docs.google.com/spreadsheets/d/ID/edit",
      "https://docs.google.com.evil.test/spreadsheets/d/e/ID/pub?output=csv",
      "javascript:alert(1)",
    ])
      expect(() => validateSheetUrl(url)).toThrow();
  });
  it("provides exactly 30 preview participants with stable unique IDs", () => {
    const demo = demoSnapshot();
    expect(demo.participants).toHaveLength(30);
    expect(new Set(demo.participants.map((p) => p.participant_id)).size).toBe(
      30,
    );
    expect(demo.participants[0].participant_id).toBe(
      demoSnapshot().participants[0].participant_id,
    );
  });
});
