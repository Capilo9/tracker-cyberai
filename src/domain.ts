import { z } from "zod";
export const tasks = ["WEBSITE", "VIDEO", "PREPOST"] as const;
export type Task = (typeof tasks)[number];
export type Progress = {
  status: boolean;
  file_name: string;
  file_url: string;
  spreadsheet_url: string;
};
export type Participant = {
  participant_id: string;
  name: string;
  institution: string;
  is_active: boolean;
  progress: Record<Task, Progress>;
};
export type Config = {
  WEBSITE_DEADLINE: string;
  VIDEO_DEADLINE: string;
  PREPOST_DEADLINE: string;
  TIMEZONE: string;
};
export type Snapshot = { participants: Participant[]; config: Config };
export const defaults: Config = {
  WEBSITE_DEADLINE: "2026-09-19T23:59:59+07:00",
  VIDEO_DEADLINE: "2026-09-26T23:59:59+07:00",
  PREPOST_DEADLINE: "2026-09-26T23:59:59+07:00",
  TIMEZONE: "Asia/Jakarta",
};
export const labels: Record<Task, string> = {
  WEBSITE: "Website",
  VIDEO: "Video",
  PREPOST: "Pre-Post Test",
};
export const participantSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  institution: z.string().trim().min(2, "Instansi minimal 2 karakter").max(160),
});
export type ParticipantInput = z.infer<typeof participantSchema>;
export const emptyProgress = (): Record<Task, Progress> =>
  Object.fromEntries(
    tasks.map((t) => [
      t,
      { status: false, file_name: "", file_url: "", spreadsheet_url: "" },
    ]),
  ) as Record<Task, Progress>;
export function calculateProgress(progress: Record<Task, Progress>): number {
  return Math.round((tasks.filter((t) => progress[t].status).length / 3) * 100);
}
export function deadlineDays(deadline: string, now = new Date()): number {
  const end = new Date(deadline);
  const jakartaDay = (date: Date) =>
    Math.floor((date.getTime() + 7 * 3600000) / 86400000);
  const days = jakartaDay(end) - jakartaDay(now);
  return now > end ? Math.min(-1, days) : days;
}
export function deadlineText(deadline: string): string {
  const d = deadlineDays(deadline);
  return d < 0
    ? "Tenggat berakhir"
    : d === 0
      ? "Berakhir hari ini"
      : `Sisa ${d} hari`;
}
export function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
export type Filters = {
  search: string;
  institution: string;
  completion: string;
  WEBSITE: string;
  VIDEO: string;
  PREPOST: string;
};
export const initialFilters: Filters = {
  search: "",
  institution: "",
  completion: "",
  WEBSITE: "",
  VIDEO: "",
  PREPOST: "",
};
export function filterParticipants(
  participants: Participant[],
  filters: Filters,
): Participant[] {
  const term = filters.search.trim().toLocaleLowerCase("id");
  return participants.filter(
    (p) =>
      p.is_active &&
      `${p.name} ${p.institution}`.toLocaleLowerCase("id").includes(term) &&
      (!filters.institution || p.institution === filters.institution) &&
      (!filters.completion ||
        (filters.completion === "complete"
          ? calculateProgress(p.progress) === 100
          : calculateProgress(p.progress) < 100)) &&
      tasks.every(
        (t) => !filters[t] || p.progress[t].status === (filters[t] === "true"),
      ),
  );
}
export function validateFile(file: {
  name: string;
  size: number;
}): string | null {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name))
    return "Gunakan file XLSX, XLS, atau CSV.";
  if (file.size === 0) return "File kosong tidak dapat diunggah.";
  if (file.size > 10 * 1024 * 1024) return "Ukuran file maksimal 10 MB.";
  return null;
}
export function validateSpreadsheetUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "docs.google.com" &&
      u.pathname.startsWith("/spreadsheets/d/")
    );
  } catch {
    return false;
  }
}
