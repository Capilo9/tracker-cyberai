import { useEffect, useMemo, useRef, useState } from "react";
import { configured } from "./api";
import { COHORT_SIZE, WEBSITE_SUBMISSION_URL, PREPOST_SUBMISSION_URL } from "./settings";
import { WorkspaceProvider, useWorkspace } from "./workspace";
import { ParticipantsPage, TrackerPage } from "./Pages";
import { useDashboardTools } from "./useDashboardTools";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  ChevronRight,
  Globe,
  Play,
  FileChartColumn,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  CalendarDays,
  Check,
  Minus,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  calculateProgress,
  dateLabel,
  deadlineText,
  tasks,
  labels,
  filterParticipants,
  initialFilters,
  type Participant,
  type Task,
} from "./domain";

const navigation = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/peserta", label: "Data Peserta", icon: Users },
  { path: "/tracker", label: "Tracker Tugas", icon: ClipboardCheck },
];
const taskIcons = { WEBSITE: Globe, VIDEO: Play, PREPOST: FileChartColumn };
export default function App() {
  return (
    <WorkspaceProvider>
      <DashboardApp />
    </WorkspaceProvider>
  );
}
function DashboardApp() {
  const { snapshot } = useWorkspace();
  const [filters, setFilters] = useState(initialFilters);
  const [expanded, setExpanded] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement as HTMLElement | null;
    const controls =
      sidebar.current?.querySelectorAll<HTMLElement>("a, button");
    controls?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
      if (event.key !== "Tab" || !controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [drawer]);
  const location = useLocation();
  const navigate = useNavigate();
  const current =
    navigation.find((n) => n.path === location.pathname) || navigation[0];
  const active = snapshot.participants.filter((p) => p.is_active);
  const filtered = useMemo(
    () => filterParticipants(snapshot.participants, filters),
    [snapshot, filters],
  );
  useDashboardTools(snapshot, filtered);
  const total = COHORT_SIZE;
  const completed = tasks.reduce(
    (sum, t) => sum + active.filter((p) => p.progress[t].status).length,
    0,
  );
  const overall = total ? Math.round((completed / (total * 3)) * 100) : 0;
  return (
    <div className="app-shell">
      {drawer && (
        <button
          className="scrim"
          aria-label="Tutup navigasi"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside ref={sidebar} className={`sidebar ${drawer ? "open" : ""}`}>
        <NavLink className="brand" to="/dashboard">
          <img
            className="official-logo"
            src="/cyber-ai-logo.png"
            alt="Cyber AI"
          />
        </NavLink>
        <div className="workspace-label">RUANG PESERTA</div>
        <nav>
          {navigation.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              onClick={() => setDrawer(false)}
              className={({ isActive }) =>
                isActive ||
                (location.pathname === "/" && n.path === "/dashboard")
                  ? "nav-item active"
                  : "nav-item"
              }
            >
              <n.icon size={21} />
              {n.label}
              <ChevronRight size={15} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mission">
            <GraduationCap size={27} />
            <p>
              Bersama AI untuk
              <br />
              pendidikan lebih baik.
            </p>
            <div className="tiny-line" />
          </div>
          <div className="sidebar-foot">
            <span className="status-dot" />
            Cyber AI · Semarang<small>Program Pendidikan 2026</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Buka navigasi"
              onClick={() => setDrawer(true)}
            >
              <Menu />
            </button>
            <img
              className="header-logo"
              src="/cyber-ai-logo.png"
              alt="Cyber AI"
            />
            <ChevronRight size={14} />
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="period">
              <CalendarDays size={15} />
              September 2026
            </span>
            <span className="participant-badge">
              <Users size={16} />
              30 peserta
            </span>
          </div>
        </header>
        <main>
          <div className="preview-note">
            <span className="status-dot" />
            {configured
              ? "Progres pengumpulan peserta"
              : "Pratinjau · 30 peserta contoh — data belum terhubung"}
          </div>
          {location.pathname === "/peserta" ? (
            <ParticipantsPage />
          ) : location.pathname === "/tracker" ? (
            <TrackerPage />
          ) : (
            <>
              <section className="welcome">
                <div className="welcome-content">
                  <span className="eyebrow">GURU BERDAYA, SISWA BERKARYA</span>
                  <h1>
                    Selamat datang, Peserta! <span className="wave">👋</span>
                  </h1>
                  <p>Pantau karya hari ini, wujudkan pendidikan esok hari.</p>
                  <div className="welcome-quote">
                    <span>“</span>Karya kecil hari ini, dampak besar untuk
                    pendidikan.
                  </div>
                </div>
                <div
                  className="hero-art"
                  role="img"
                  aria-label="Guru bersama siswa menggunakan teknologi pendidikan"
                />
              </section>
              <div className="section-heading">
                <div>
                  <h2>Ringkasan pengumpulan</h2>
                  <p>Perkembangan tiga tugas utama peserta Cyber AI.</p>
                </div>
                <span className="live-label">
                  <span className="status-dot" />
                  Tahun ajaran 2026 / 2027
                </span>
              </div>
              <section className="stat-grid">
                {tasks.map((t, i) => {
                  const Icon = taskIcons[t];
                  const count = active.filter(
                    (p) => p.progress[t].status,
                  ).length;
                  const percentage = total
                    ? Math.round((count / total) * 100)
                    : 0;
                  const submissionUrl = t === "WEBSITE"
                    ? WEBSITE_SUBMISSION_URL
                    : t === "PREPOST" ? PREPOST_SUBMISSION_URL : undefined;
                  return (
                    <a
                      className={`stat-card task-${t}`}
                      key={t}
                      href={submissionUrl ?? "/tracker?task=" + t}
                      target={submissionUrl ? "_blank" : undefined}
                      rel={submissionUrl ? "noopener noreferrer" : undefined}
                    >
                      <div className="stat-top">
                        <span className="task-number">0{i + 1}</span>
                        <span className="task-icon">
                          <Icon size={24} />
                        </span>
                      </div>
                      <h3>
                        {t === "PREPOST"
                          ? "Skor Pre-Post Test"
                          : `Tugas ${labels[t]}`}
                      </h3>
                      <p>
                        {t === "WEBSITE"
                          ? "Website hasil karya peserta"
                          : t === "VIDEO"
                            ? "Video praktik baik implementasi"
                            : "Hasil asesmen awal dan akhir"}
                      </p>
                      <div className="stat-value">
                        <strong>
                          {count}
                          <span> / {total} peserta</span>
                        </strong>
                        <b>{percentage}%</b>
                      </div>
                      <div className="progress-track">
                        <div style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="stat-bottom">
                        <span>
                          <CalendarDays size={13} />
                          {dateLabel(snapshot.config[`${t}_DEADLINE`])}
                        </span>
                        <ArrowUpRight size={16} />
                      </div>
                      {submissionUrl && (
                        <span className="submission-link">
                          {t === "WEBSITE" ? "Kumpulkan tugas website" : "Isi formulir skor Pre-Post Test"} <ArrowUpRight size={15} />
                        </span>
                      )}
                    </a>
                  );
                })}
              </section>
              <div className="content-grid">
                <section className="panel progress-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Rekap progres peserta</h2>
                      <p>Setiap langkah kecil berarti kemajuan.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("/tracker")}
                    >
                      Lihat tracker
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="table-toolbar">
                    <label className="search-field">
                      <Search size={18} />
                      <input
                        placeholder="Cari nama atau instansi…"
                        aria-label="Cari nama atau instansi"
                        value={filters.search}
                        onChange={(e) =>
                          setFilters({ ...filters, search: e.target.value })
                        }
                      />
                      {filters.search && (
                        <button
                          aria-label="Hapus pencarian"
                          onClick={() => setFilters({ ...filters, search: "" })}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <button
                      className={`filter-button ${expanded ? "selected" : ""}`}
                      onClick={() => setExpanded(!expanded)}
                    >
                      <SlidersHorizontal size={16} />
                      Filter
                      {Object.values(filters).filter(Boolean).length > 0 && (
                        <span className="filter-count">
                          {Object.values(filters).filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>
                  {expanded && (
                    <div className="filters">
                      <select
                        aria-label="Instansi"
                        value={filters.institution}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            institution: e.target.value,
                          })
                        }
                      >
                        <option value="">Semua instansi</option>
                        {[...new Set(active.map((p) => p.institution))]
                          .sort()
                          .map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                      </select>
                      <select
                        aria-label="Kelengkapan"
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
                          aria-label={`Status ${labels[t]}`}
                          key={t}
                          value={filters[t]}
                          onChange={(e) =>
                            setFilters({ ...filters, [t]: e.target.value })
                          }
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
                        Reset
                      </button>
                    </div>
                  )}
                  <ProgressTable participants={filtered.slice(0, 5)} />
                  <div className="table-footer">
                    <span>
                      Menampilkan {Math.min(5, filtered.length)} dari{" "}
                      {filtered.length} peserta
                    </span>
                    <div className="legend">
                      <span>
                        <Check size={12} />
                        Sudah
                      </span>
                      <span>
                        <Minus size={12} />
                        Belum
                      </span>
                    </div>
                  </div>
                </section>
                <aside className="insight-column">
                  <section className="panel overview">
                    <div className="overview-title">
                      <Users size={18} />
                      <h3>Total peserta</h3>
                    </div>
                    <div className="overview-body">
                      <div>
                        <strong>{total}</strong>
                        <span>peserta program</span>
                      </div>
                      <div className="donut">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { value: overall },
                                { value: 100 - overall },
                              ]}
                              dataKey="value"
                              innerRadius={34}
                              outerRadius={43}
                              startAngle={90}
                              endAngle={-270}
                              stroke="none"
                              cornerRadius={8}
                            >
                              <Cell fill="#2475ed" />
                              <Cell fill="#eaf0f8" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <b>{overall}%</b>
                      </div>
                    </div>
                    <div className="overview-footer">
                      <span>Rata-rata kelengkapan</span>
                      <strong>{overall}%</strong>
                    </div>
                  </section>
                  <section className="panel deadline-panel">
                    <h3>
                      <CalendarDays size={18} />
                      Jadwal pengumpulan
                    </h3>
                    {tasks.map((t) => (
                      <div className="deadline-row" key={t}>
                        <div>
                          <span>{labels[t]}</span>
                          <strong>
                            {dateLabel(snapshot.config[`${t}_DEADLINE`])}
                          </strong>
                        </div>
                        <small>
                          {deadlineText(snapshot.config[`${t}_DEADLINE`])}
                        </small>
                      </div>
                    ))}
                  </section>
                  <div className="quote-panel">
                    <span>“</span>
                    <div>
                      <p>
                        Teknologi bukan tujuan,
                        <br />
                        tetapi jembatan untuk menciptakan pembelajaran yang
                        bermakna.
                      </p>
                      <small>— Cyber AI</small>
                    </div>
                  </div>
                </aside>
              </div>
              <div className="help-banner">
                <BookOpen size={19} />
                <span>
                  Progres diperbarui oleh panitia. Hubungi panitia jika status
                  belum sesuai.
                </span>
                <a
                  className="text-button"
                  href={WEBSITE_SUBMISSION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kumpulkan website
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </>
          )}
        </main>
        <footer>
          <span>
            © 2026 Cyber AI. Bersama membangun pendidikan yang lebih baik.
          </span>
          <span>
            #GuruMelekAI <b>·</b> #KaryaNyata
          </span>
        </footer>
      </div>
    </div>
  );
}
function ProgressTable({ participants }: { participants: Participant[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama peserta</th>
            <th>Instansi</th>
            <th>Website</th>
            <th>Video</th>
            <th>Pre-Post</th>
            <th>Progres</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, i) => (
            <tr key={p.participant_id}>
              <td className="row-number">{String(i + 1).padStart(2, "0")}</td>
              <td>
                <span className={`person-avatar avatar-${i % 4}`}>
                  {p.name
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join("")}
                </span>
                <strong>{p.name}</strong>
              </td>
              <td className="institution">{p.institution}</td>
              {tasks.map((t: Task) => (
                <td key={t} className="status-cell">
                  <span
                    className={`task-status ${p.progress[t].status ? "done" : "pending"}`}
                    aria-label={p.progress[t].status ? "Sudah" : "Belum"}
                  >
                    {p.progress[t].status ? (
                      <Check size={13} />
                    ) : (
                      <Minus size={13} />
                    )}
                  </span>
                </td>
              ))}
              <td>
                <div
                  className={`row-progress ${calculateProgress(p.progress) === 100 ? "complete" : ""}`}
                >
                  <span>
                    <i style={{ width: `${calculateProgress(p.progress)}%` }} />
                  </span>
                  <b>{calculateProgress(p.progress)}%</b>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!participants.length && (
        <div className="empty-state">
          <Search />
          <h3>Peserta tidak ditemukan</h3>
          <p>Coba kata kunci atau filter lain.</p>
        </div>
      )}
    </div>
  );
}
