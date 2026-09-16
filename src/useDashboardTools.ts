import { useEffect } from "react";
import { calculateProgress, type Participant, type Snapshot } from "./domain";
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useDashboardTools(snapshot: Snapshot, visible: Participant[]) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "get_dashboard_progress",
            title: "Baca progres dashboard",
            description:
              "Membaca peserta yang sesuai pencarian dan filter dashboard saat ini, tanpa mengubah data.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Input harus berupa objek kosong.");
              return {
                totalActive: snapshot.participants.filter((p) => p.is_active)
                  .length,
                filteredCount: visible.length,
                participants: visible.map((p) => ({
                  name: p.name,
                  institution: p.institution,
                  progress: calculateProgress(p.progress),
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional browser capability. */
      });
    } catch {
      /* Unsupported registration must not block the dashboard. */
    }
    return () => lifecycle.abort();
  }, [snapshot, visible]);
}
