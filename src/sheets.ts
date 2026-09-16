import { defaults, emptyProgress, type Snapshot } from "./domain";
import { COHORT_SIZE } from "./settings";
const columns = [
  "participant_id",
  "name",
  "institution",
  "website",
  "video",
  "prepost",
];
export function validateSheetUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Alamat sumber data bukan URL yang valid.");
  }
  const publishedSheet =
    url.hostname === "docs.google.com" &&
    /^\/spreadsheets\/d\/e\/[A-Za-z0-9_-]+\/pub$/.test(url.pathname) &&
    url.searchParams.get("output") === "csv";
  const appsScript =
    url.hostname === "script.google.com" &&
    /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (!publishedSheet && !appsScript)
  )
    throw new Error(
      "Gunakan URL CSV publik Google Sheets atau URL web app Apps Script yang berakhiran /exec.",
    );
  return url.toString();
}
/** Handles quoted commas, embedded newlines, escaped quotes, BOM and CRLF. */
export function parseCsv(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closed = false;
  const finishCell = () => {
    row.push(cell);
    cell = "";
    closed = false;
  };
  const finishRow = () => {
    finishCell();
    if (row.some((v) => v.trim())) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
      continue;
    }
    if (char === ",") {
      finishCell();
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      finishRow();
      continue;
    }
    if (closed) {
      if (char === " " || char === "\t") continue;
      throw new Error("Format CSV tidak valid setelah tanda kutip.");
    }
    if (char === '"') {
      if (cell.length) throw new Error("Tanda kutip CSV tidak valid.");
      quoted = true;
      continue;
    }
    cell += char;
  }
  if (quoted) throw new Error("Tanda kutip CSV belum ditutup.");
  if (cell.length || row.length || closed) finishRow();
  return rows;
}
export function parseStatus(value: string, row: number): boolean {
  const status = value.trim().toLowerCase();
  if (["sudah", "true", "1"].includes(status)) return true;
  if (["", "belum", "false", "0"].includes(status)) return false;
  throw new Error(
    `Status pada baris ${row} harus SUDAH/BELUM atau TRUE/FALSE.`,
  );
}
export function parsePublishedSheet(csv: string): Snapshot {
  const [header, ...rows] = parseCsv(csv);
  if (!header) throw new Error("Lembar progres kosong.");
  const normalized = header.map((v) => v.trim().toLowerCase());
  if (
    new Set(normalized).size !== normalized.length ||
    columns.some((c) => !normalized.includes(c))
  )
    throw new Error(
      "Header wajib: participant_id, name, institution, website, video, prepost.",
    );
  if (rows.length > COHORT_SIZE)
    throw new Error(
      "Lembar progres melebihi 30 peserta. Periksa baris duplikat.",
    );
  const ids = new Set<string>();
  const participants = rows.map((row, index) => {
    if (row.length !== header.length)
      throw new Error(
        `Jumlah kolom pada baris ${index + 2} tidak sesuai header.`,
      );
    const get = (key: string) => row[normalized.indexOf(key)].trim();
    const id = get("participant_id"),
      name = get("name"),
      institution = get("institution");
    if (!id || !name || !institution)
      throw new Error(
        `ID, nama, dan instansi wajib diisi pada baris ${index + 2}.`,
      );
    if (ids.has(id))
      throw new Error(`ID peserta duplikat pada baris ${index + 2}.`);
    ids.add(id);
    const progress = emptyProgress();
    progress.WEBSITE.status = parseStatus(get("website"), index + 2);
    progress.VIDEO.status = parseStatus(get("video"), index + 2);
    progress.PREPOST.status = parseStatus(get("prepost"), index + 2);
    return { participant_id: id, name, institution, is_active: true, progress };
  });
  return { participants, config: { ...defaults } };
}
