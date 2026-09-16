import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { configured, getSnapshot } from "./api";
import { demoSnapshot } from "./demo";
import type { Snapshot } from "./domain";
const Context = createContext<{ snapshot: Snapshot } | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Data belum tersedia");
  return value;
}
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["participant-progress"],
    queryFn: ({ signal }) => getSnapshot(signal),
    enabled: configured,
    initialData: configured ? undefined : demoSnapshot,
    refetchInterval: configured ? 60000 : false,
    refetchOnWindowFocus: configured,
    staleTime: 30000,
  });
  if (query.isPending)
    return (
      <div
        className="loading-page"
        role="status"
        aria-label="Memuat progres peserta"
      >
        <div className="skeleton wide" />
        <div className="skeleton" />
        <div className="skeleton" />
        <p>Memuat progres peserta…</p>
      </div>
    );
  if (query.isError && !query.data)
    return (
      <div className="connection-error">
        <img src="/cyber-ai-logo.png" alt="Cyber AI" />
        <h1>Progres belum dapat dimuat</h1>
        <p>{query.error.message}</p>
        <button
          className="primary-button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Memuat…" : "Coba lagi"}
        </button>
        <p>Jika masalah berlanjut, hubungi panitia.</p>
      </div>
    );
  return (
    <Context.Provider value={{ snapshot: query.data! }}>
      {query.isError && (
        <div className="sync-warning" role="status">
          Pembaruan tertunda. Menampilkan data terakhir yang berhasil dimuat.{" "}
          <button onClick={() => void query.refetch()}>Coba lagi</button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
