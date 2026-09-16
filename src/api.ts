import { parsePublishedSheet, validateSheetUrl } from "./sheets";
import type { Snapshot } from "./domain";
export const sheetsUrl = (
  import.meta.env.VITE_SHEETS_CSV_URL as string | undefined
)?.trim();
export const configured = Boolean(sheetsUrl);
export async function getSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  if (!sheetsUrl) throw new Error("Sumber data belum diatur.");
  const url = validateSheetUrl(sheetsUrl);
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch(url, {
    method: "GET",
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    credentials: "omit",
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      "Progres belum tersedia. Periksa akses sumber data Google Sheets atau Apps Script.",
    );
  const csv = await response.text();
  if (csv.trimStart().startsWith("{")) {
    try {
      const error = JSON.parse(csv) as { ok?: boolean; message?: string };
      if (error.ok === false)
        throw new Error(
          error.message || "Sumber data belum siap. Hubungi panitia.",
        );
    } catch (error) {
      if (error instanceof Error && !(error instanceof SyntaxError))
        throw error;
    }
  }
  if (csv.length > 1000000)
    throw new Error(
      "Data terlalu besar. Publikasikan hanya lembar progres peserta.",
    );
  return parsePublishedSheet(csv);
}
