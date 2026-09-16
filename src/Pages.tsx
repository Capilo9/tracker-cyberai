import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ArrowUpRight, Check, Minus } from "lucide-react";
import { useWorkspace } from "./workspace";
import {
  calculateProgress,
  dateLabel,
  deadlineText,
  filterParticipants,
  initialFilters,
  labels,
  tasks,
  type Task,
} from "./domain";
import { COHORT_SIZE, WEBSITE_SUBMISSION_URL } from "./settings";

export function ParticipantsPage() {
  return <ParticipantProgressPage tracker={false} />;
}
export function TrackerPage() {
  return <ParticipantProgressPage tracker />;
}
function ParticipantProgressPage({ tracker }: { tracker: boolean }) {
  const { snapshot } = useWorkspace();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => {
    const t = searchParams.get("task");
    return tracker && t && tasks.includes(t as Task)
      ? { ...initialFilters, [t]: "false" }
      : initialFilters;
  });
  const list = filterParticipants(snapshot.participants, filters);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">
            {tracker ? "SETIAP KARYA BERARTI" : "BERTUMBUH BERSAMA"}
          </span>
          <h1>{tracker ? "Tracker tugas" : "Data peserta"}</h1>
          <p>
            {tracker
              ? "Lihat status pengumpulan Website, Video, dan Pre-Post Test."
              : "30 peserta Cyber AI, satu semangat untuk pendidikan yang lebih baik."}
          </p>
        </div>
        <a
          className="primary-button"
          href={WEBSITE_SUBMISSION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Kumpulkan tugas website
          <ArrowUpRight size={17} />
        </a>
      </div>
      {tracker && (
        <div className="tracker-deadlines">
          {tasks.map((t) => (
            <div key={t}>
              <span>{labels[t]}</span>
              <strong>{dateLabel(snapshot.config[`${t}_DEADLINE`])}</strong>
              <small>{deadlineText(snapshot.config[`${t}_DEADLINE`])}</small>
            </div>
          ))}
        </div>
      )}
      <section className="panel management-panel">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Cari peserta"
              placeholder="Cari nama atau instansi…"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </label>
          <span className="muted">
            {snapshot.participants.length} dari {COHORT_SIZE} peserta tercatat
          </span>
        </div>
        <div className="filters">
          <select
            aria-label="Filter instansi"
            value={filters.institution}
            onChange={(e) =>
              setFilters({ ...filters, institution: e.target.value })
            }
          >
            <option value="">Semua instansi</option>
            {[...new Set(snapshot.participants.map((p) => p.institution))]
              .sort()
              .map((v) => (
                <option key={v}>{v}</option>
              ))}
          </select>
          <select
            aria-label="Filter progres"
            value={filters.completion}
            onChange={(e) =>
              setFilters({ ...filters, completion: e.target.value })
            }
          >
            <option value="">Semua progres</option>
            <option value="complete">Lengkap</option>
            <option value="incomplete">Belum lengkap</option>
          </select>
          {tasks.map((t) => (
            <select
              key={t}
              aria-label={`Filter ${labels[t]}`}
              value={filters[t]}
              onChange={(e) => setFilters({ ...filters, [t]: e.target.value })}
            >
              <option value="">{labels[t]}: semua</option>
              <option value="true">Sudah</option>
              <option value="false">Belum</option>
            </select>
          ))}
          <button
            className="text-button"
            onClick={() => setFilters(initialFilters)}
          >
            Reset filter
          </button>
        </div>
        <div className="table-scroll">
          <table className="participant-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama peserta</th>
                <th>Instansi</th>
                {tasks.map((t) => (
                  <th key={t}>{labels[t]}</th>
                ))}
                <th>Progres</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.participant_id}>
                  <td>{i + 1}</td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.institution}</td>
                  {tasks.map((t) => (
                    <td key={t}>
                      <span
                        className={`readonly-status ${p.progress[t].status ? "done" : "pending"}`}
                      >
                        {p.progress[t].status ? (
                          <Check size={13} />
                        ) : (
                          <Minus size={13} />
                        )}{" "}
                        {p.progress[t].status ? "Sudah" : "Belum"}
                      </span>
                    </td>
                  ))}
                  <td>
                    <span className="completion-pill">
                      {calculateProgress(p.progress)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && (
          <div className="empty-state">
            <Search />
            <h3>Peserta tidak ditemukan</h3>
            <p>Ubah pencarian atau reset filter.</p>
          </div>
        )}
        <div className="table-footer">
          {list.length} peserta ditampilkan · Progres diperbarui oleh panitia.
        </div>
      </section>
    </>
  );
}
