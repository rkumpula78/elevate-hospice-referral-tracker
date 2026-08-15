/**
 * HuddleBoard.tsx — Elevate Weekly Growth Huddle
 * Drop into: src/pages/HuddleBoard.tsx   Route: /huddle
 *
 * Deps: @supabase/supabase-js (existing client), lucide-react, tailwind.
 * No shadcn required — plain Tailwind so it drops into any Lovable project.
 *
 * PHI POSTURE: this board never renders patient names, SSN, DOB, or Medicare
 * numbers. Referrals show as a short code + org + age-in-status. Click through
 * to the existing referral page for detail.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Play, Square, Plus, ChevronRight, Clock, AlertTriangle, Target,
  TrendingUp, MessageSquarePlus, Link2, CheckCircle2, X, RefreshCw,
} from "lucide-react";

/* ---------- config ---------- */
const ORG_ROUTE = (id: string) => `/organizations/${id}`;
const REFERRAL_ROUTE = (id: string) => `/referrals/${id}`;

const SEGMENTS = [
  { key: "wins",       label: "Wins & Story",        minutes: 5  },
  { key: "scorecard",  label: "Scorecard",           minutes: 8  },
  { key: "pipeline",   label: "Pipeline Board",      minutes: 10 },
  { key: "roundrobin", label: "Territory Round-Robin", minutes: 12 },
  { key: "issues",     label: "Issues (IDS)",        minutes: 20 },
  { key: "commit",     label: "Commitments & Close", minutes: 5  },
];

const CATEGORY_LABEL: Record<string, string> = {
  leading: "Leading — activity we control",
  pipeline: "Pipeline — the conversion engine",
  lagging: "Lagging — the result",
  meta: "Adoption",
};

/* ---------- types ---------- */
type Metric = {
  metric_key: string; label: string; category: string; owner_label: string | null;
  target_value: number | null; unit: string | null; direction: string;
  source_mode: string; sort_order: number; help_text: string | null;
};
type Snapshot = {
  id: string; meeting_id: string; metric_key: string; value: number | null;
  target_value: number | null; source: string; status: string | null;
  prior_value: number | null; note: string | null;
};
type OrgPulse = {
  organization_id: string; name: string; org_type: string | null; city: string | null;
  bd_tier: string | null; bd_status: string | null; assigned_marketer: string | null;
  is_target_account: boolean; target_rank: number | null; target_goal: string | null;
  referrals_7d: number; referrals_30d: number; referrals_90d: number;
  open_referrals: number; admits_90d: number; activities_30d: number;
  days_since_touch: number | null; never_touched: boolean;
  last_activity_at: string | null; last_activity_type: string | null;
  last_next_step: string | null; last_next_step_date: string | null;
  next_followup_date: string | null;
};
type Item = {
  id: string; type: "issue" | "commitment" | "watch"; status: string; title: string;
  body: string | null; owner_label: string | null; owner_name: string | null;
  organization_id: string | null; organization_name: string | null;
  due_date: string | null; goal_text: string | null; expires_on: string | null;
  carried_count: number; note_count: number; last_note: string | null;
  is_overdue: boolean; is_expired: boolean;
};
type Meeting = { id: string; meeting_date: string; status: string; avg_rating: number | null };

/* ---------- small ui ---------- */
const SOURCE_BADGE: Record<string, { dot: string; cls: string; title: string }> = {
  self_reported: { dot: "○", cls: "text-slate-400 border-slate-200 bg-slate-50",   title: "Self-reported — typed in at the meeting" },
  partial:       { dot: "◐", cls: "text-amber-600 border-amber-200 bg-amber-50",   title: "Partial — some system data, some manual" },
  system:        { dot: "●", cls: "text-teal-700 border-teal-200 bg-teal-50",      title: "System — pulled from the CRM, nobody typed it" },
};

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    teal:  "bg-teal-50 text-teal-700 border-teal-200",
    red:   "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue:  "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${tones[tone] ?? tones.slate}`}>{children}</span>;
}

/* ---------- metric tile ---------- */
function MetricTile({
  metric, snap, live, onSave,
}: {
  metric: Metric; snap?: Snapshot; live: boolean;
  onSave: (key: string, value: number | null, note: string | null, source: string) => void;
}) {
  const [val, setVal] = useState<string>(snap?.value != null ? String(snap.value) : "");
  const [note, setNote] = useState<string>(snap?.note ?? "");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setVal(snap?.value != null ? String(snap.value) : "");
    setNote(snap?.note ?? "");
    setDirty(false);
  }, [snap?.value, snap?.note]);

  const target = snap?.target_value ?? metric.target_value;
  const num = val === "" ? null : Number(val);
  const ok = num != null && target != null
    ? (metric.direction === "lower_better" ? num <= target : num >= target)
    : null;
  const delta = num != null && snap?.prior_value != null ? num - snap.prior_value : null;
  const badge = SOURCE_BADGE[snap?.source ?? metric.source_mode] ?? SOURCE_BADGE.self_reported;

  const commit = () => {
    if (!dirty) return;
    // manual typing downgrades a system metric to partial — the board stays honest
    const src = snap?.source === "system" && num !== snap?.value ? "partial" : (snap?.source ?? metric.source_mode);
    onSave(metric.metric_key, num, note || null, src);
    setDirty(false);
  };

  return (
    <div className={`rounded-xl border bg-white p-3 transition ${
      ok === true ? "border-emerald-200" : ok === false ? "border-red-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-slate-800" title={metric.label}>{metric.label}</div>
          <div className="truncate text-[11px] text-slate-500">{metric.owner_label ?? "—"}</div>
        </div>
        <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] ${badge.cls}`} title={badge.title}>{badge.dot}</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        {live ? (
          <input
            inputMode="decimal"
            value={val}
            onChange={(e) => { setVal(e.target.value); setDirty(true); }}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="—"
            className={`w-20 rounded-md border px-2 py-1 text-2xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-sky-300 ${
              ok === true ? "text-emerald-700 border-emerald-200"
              : ok === false ? "text-red-700 border-red-200"
              : "text-slate-800 border-slate-200"}`}
          />
        ) : (
          <span className={`text-2xl font-bold tabular-nums ${
            ok === true ? "text-emerald-700" : ok === false ? "text-red-700" : "text-slate-800"}`}>
            {val === "" ? "—" : val}
          </span>
        )}
        <span className="text-[11px] text-slate-500">
          {target != null ? `target ${target}${metric.unit === "%" ? "%" : ""}` : "no target"}
        </span>
        {delta != null && delta !== 0 && (
          <span className={`text-[11px] font-semibold ${delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
          </span>
        )}
      </div>

      {live && (
        <input
          value={note}
          onChange={(e) => { setNote(e.target.value); setDirty(true); }}
          onBlur={commit}
          placeholder="note…"
          className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-sky-200"
        />
      )}
      {!live && snap?.note && <div className="mt-1 text-[12px] italic text-slate-500">{snap.note}</div>}
    </div>
  );
}

/* ---------- org card ---------- */
function OrgCard({ o, onNote, onWatch }: { o: OrgPulse; onNote: (o: OrgPulse) => void; onWatch: (o: OrgPulse) => void }) {
  const stale = o.never_touched || (o.days_since_touch ?? 999) > 30;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 hover:border-teal-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <a href={ORG_ROUTE(o.organization_id)} className="min-w-0 group">
          <div className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-sky-700">{o.name}</div>
          <div className="truncate text-[11px] text-slate-500">
            {(o.org_type ?? "").replace(/_/g, " ")}{o.city ? ` · ${o.city}` : ""}{o.assigned_marketer ? ` · ${o.assigned_marketer}` : ""}
          </div>
        </a>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onNote(o)} title="Quick note" className="rounded-md border border-slate-200 p-1 hover:bg-slate-50">
            <MessageSquarePlus className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <button onClick={() => onWatch(o)} title="Add to this week's board" className="rounded-md border border-slate-200 p-1 hover:bg-slate-50">
            <Link2 className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <Pill tone={o.referrals_30d > 0 ? "teal" : "slate"}>{o.referrals_30d} · 30d</Pill>
        <Pill tone="slate">{o.referrals_90d} · 90d</Pill>
        {o.open_referrals > 0 && <Pill tone="blue">{o.open_referrals} open</Pill>}
        {o.bd_tier && <Pill tone="slate">tier {o.bd_tier}</Pill>}
        <Pill tone={stale ? "red" : "green"}>
          {o.never_touched ? "never touched" : `${o.days_since_touch}d since touch`}
        </Pill>
      </div>

      {o.target_goal && <div className="mt-2 text-[11px] text-slate-600"><Target className="mr-1 inline h-3 w-3" />{o.target_goal}</div>}
      {o.last_next_step && (
        <div className="mt-1 truncate text-[11px] text-slate-600">
          <ChevronRight className="mr-0.5 inline h-3 w-3" />{o.last_next_step}
          {o.last_next_step_date ? ` · ${o.last_next_step_date}` : ""}
        </div>
      )}
    </div>
  );
}

/* ---------- item row ---------- */
function ItemRow({ item, live, onNote, onResolve }: {
  item: Item; live: boolean; onNote: (i: Item) => void; onResolve: (i: Item) => void;
}) {
  const tone = item.type === "issue" ? "red" : item.type === "commitment" ? "blue" : "teal";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={tone}>{item.type}</Pill>
            {item.carried_count > 0 && (
              <Pill tone={item.carried_count >= 3 ? "red" : "amber"}>
                carried {item.carried_count}{item.carried_count >= 3 ? " — decide" : ""}
              </Pill>
            )}
            {item.is_overdue && <Pill tone="red">overdue</Pill>}
            {item.is_expired && <Pill tone="amber">expired</Pill>}
            {item.organization_name && (
              <a href={item.organization_id ? ORG_ROUTE(item.organization_id) : "#"} className="text-[11px] font-semibold text-sky-700 hover:underline">
                {item.organization_name}
              </a>
            )}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-slate-800">{item.title}</div>
          {item.body && <div className="text-[12px] text-slate-600">{item.body}</div>}
          <div className="mt-1 text-[11px] text-slate-500">
            {item.owner_name ?? item.owner_label ?? "unassigned"}
            {item.due_date ? ` · due ${item.due_date}` : ""}
            {item.goal_text ? ` · goal: ${item.goal_text}` : ""}
            {item.expires_on ? ` · expires ${item.expires_on}` : ""}
          </div>
          {item.last_note && (
            <div className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] italic text-slate-600">
              “{item.last_note}” {item.note_count > 1 ? `· ${item.note_count} notes` : ""}
            </div>
          )}
        </div>
        {live && (
          <div className="flex shrink-0 gap-1">
            <button onClick={() => onNote(item)} title="Add note" className="rounded-md border border-slate-200 p-1 hover:bg-slate-50">
              <MessageSquarePlus className="h-3.5 w-3.5 text-slate-500" />
            </button>
            <button onClick={() => onResolve(item)} title="Resolve" className="rounded-md border border-slate-200 p-1 hover:bg-emerald-50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= MAIN ================= */
export default function HuddleBoard() {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [snaps, setSnaps] = useState<Record<string, Snapshot>>({});
  const [producers, setProducers] = useState<OrgPulse[]>([]);
  const [targets, setTargets] = useState<OrgPulse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [seg, setSeg] = useState(0);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { kind: "note" | "watch" | "item"; org?: OrgPulse; item?: Item }>(null);

  const live = meeting?.status === "live";

  /* timer */
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const segLimit = SEGMENTS[seg].minutes * 60;
  const over = secs > segLimit;

  const loadAll = useCallback(async (meetingId?: string) => {
    const [{ data: m }, { data: prod }, { data: tgt }, { data: it }] = await Promise.all([
      supabase.from("huddle_metrics").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("v_huddle_top_producers").select("*").order("referrals_90d", { ascending: false }).limit(10),
      supabase.from("v_huddle_target_accounts").select("*").order("days_since_touch", { ascending: false, nullsFirst: true }).limit(12),
      supabase.from("v_huddle_open_items").select("*").order("carried_count", { ascending: false }),
    ]);
    setMetrics((m as Metric[]) ?? []);
    setProducers((prod as OrgPulse[]) ?? []);
    setTargets((tgt as OrgPulse[]) ?? []);
    setItems((it as Item[]) ?? []);
    if (meetingId) {
      const { data: s } = await supabase.from("huddle_snapshots").select("*").eq("meeting_id", meetingId);
      const map: Record<string, Snapshot> = {};
      (s as Snapshot[] ?? []).forEach((x) => (map[x.metric_key] = x));
      setSnaps(map);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: mt } = await supabase.from("huddle_meetings").select("*")
        .order("meeting_date", { ascending: false }).limit(1).maybeSingle();
      setMeeting((mt as Meeting) ?? null);
      await loadAll((mt as Meeting)?.id);
      setLoading(false);
    })();
  }, [loadAll]);

  const openMeeting = async () => {
    const { data, error } = await supabase.rpc("fn_huddle_open_meeting", { p_date: new Date().toISOString().slice(0, 10) });
    if (error) return alert(error.message);
    const { data: mt } = await supabase.from("huddle_meetings").select("*").eq("id", data as string).single();
    setMeeting(mt as Meeting);
    await loadAll(data as string);
    setRunning(true); setSeg(0); setSecs(0);
  };

  const closeMeeting = async () => {
    if (!meeting) return;
    if (!confirm("Close the meeting? The scorecard freezes and cannot be edited.")) return;
    const { error } = await supabase.rpc("fn_huddle_close_meeting", { p_meeting_id: meeting.id });
    if (error) return alert(error.message);
    setRunning(false);
    const { data: mt } = await supabase.from("huddle_meetings").select("*").eq("id", meeting.id).single();
    setMeeting(mt as Meeting);
    await loadAll(meeting.id);
  };

  const saveMetric = async (key: string, value: number | null, note: string | null, source: string) => {
    if (!meeting) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("huddle_snapshots")
      .update({ value, note, source, entered_by: user?.id ?? null, entered_at: new Date().toISOString() })
      .eq("meeting_id", meeting.id).eq("metric_key", key).select().single();
    if (error) return console.error(error);
    setSnaps((p) => ({ ...p, [key]: data as Snapshot }));
  };

  const grouped = useMemo(() => {
    const g: Record<string, Metric[]> = {};
    metrics.forEach((m) => { (g[m.category] ||= []).push(m); });
    return g;
  }, [metrics]);

  const systemPct = useMemo(() => {
    const vals = Object.values(snaps).filter((s) => s.metric_key !== "pct_system_data");
    if (!vals.length) return 0;
    return Math.round((vals.filter((s) => s.source === "system").length / vals.length) * 100);
  }, [snaps]);

  if (loading) return <div className="p-8 text-slate-500">Loading huddle…</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal-600">Weekly Growth Huddle</div>
            <div className="text-lg font-bold text-slate-900">
              {meeting ? new Date(meeting.meeting_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "No meeting yet"}
              {meeting && <span className={`ml-2 rounded-md border px-2 py-0.5 text-[11px] ${
                meeting.status === "live" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>{meeting.status}</span>}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
              scorecard on system data: <b className="text-slate-900">{systemPct}%</b>
            </div>
            <button onClick={() => loadAll(meeting?.id)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50" title="Refresh">
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
            {!live ? (
              <button onClick={openMeeting} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                <Play className="h-4 w-4" /> Start meeting
              </button>
            ) : (
              <button onClick={closeMeeting} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Square className="h-4 w-4" /> Close & freeze
              </button>
            )}
          </div>
        </div>

        {/* segment stepper */}
        {live && (
          <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-5 pb-2">
            {SEGMENTS.map((s, i) => (
              <button key={s.key} onClick={() => { setSeg(i); setSecs(0); }}
                className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-[12px] font-medium ${
                  i === seg ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                {i + 1}. {s.label} <span className="opacity-60">{s.minutes}m</span>
              </button>
            ))}
            <div className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold tabular-nums ${
              over ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`}>
              <Clock className="h-3.5 w-3.5" />
              {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
              {over && <AlertTriangle className="h-3.5 w-3.5" />}
              <button onClick={() => setRunning((r) => !r)} className="ml-1 text-[11px] underline">{running ? "pause" : "run"}</button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-5">
        {!meeting && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="text-slate-600">No huddle has been opened yet.</div>
            <button onClick={openMeeting} className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Start this week's huddle</button>
          </div>
        )}

        {meeting && (
          <>
            {/* SCORECARD */}
            {["leading", "pipeline", "lagging"].map((cat) => (
              <section key={cat} className="mb-6">
                <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-teal-600">{CATEGORY_LABEL[cat]}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(grouped[cat] ?? []).map((m) => (
                    <MetricTile key={m.metric_key} metric={m} snap={snaps[m.metric_key]} live={live} onSave={saveMetric} />
                  ))}
                </div>
              </section>
            ))}

            {/* ORG PANELS */}
            <div className="mb-6 grid gap-5 lg:grid-cols-2">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-teal-600">
                    <TrendingUp className="mr-1 inline h-3.5 w-3.5" />Top producers — protect these
                  </h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {producers.map((o) => (
                    <OrgCard key={o.organization_id} o={o}
                      onNote={(x) => setModal({ kind: "note", org: x })}
                      onWatch={(x) => setModal({ kind: "watch", org: x })} />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
                    <Target className="mr-1 inline h-3.5 w-3.5" />Target accounts — convert these
                  </h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {targets.map((o) => (
                    <OrgCard key={o.organization_id} o={o}
                      onNote={(x) => setModal({ kind: "note", org: x })}
                      onWatch={(x) => setModal({ kind: "watch", org: x })} />
                  ))}
                </div>
              </section>
            </div>

            {/* ITEMS */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-teal-600">Carried forward — issues, commitments, watches</h2>
                <button onClick={() => setModal({ kind: "item" })}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                {items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-[13px] text-slate-500">Nothing open. Add an issue, a commitment, or a facility to watch.</div>}
                {items.map((i) => (
                  <ItemRow key={i.id} item={i} live={live}
                    onNote={(x) => setModal({ kind: "note", item: x })}
                    onResolve={async (x) => {
                      await supabase.from("huddle_items").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", x.id);
                      loadAll(meeting.id);
                    }} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {modal && <QuickModal modal={modal} meetingId={meeting?.id ?? null}
        onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(meeting?.id); }} />}
    </div>
  );
}

/* ---------- modal: quick note / watch / new item ---------- */
function QuickModal({ modal, meetingId, onClose, onDone }: {
  modal: { kind: "note" | "watch" | "item"; org?: OrgPulse; item?: Item };
  meetingId: string | null; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"issue" | "commitment" | "watch">("issue");
  const [due, setDue] = useState("");
  const [goal, setGoal] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (modal.kind === "note" && modal.item) {
      await supabase.from("huddle_item_notes").insert({ item_id: modal.item.id, meeting_id: meetingId, author_id: user?.id ?? null, body });
    } else if (modal.kind === "note" && modal.org) {
      // quick note on an org with no item yet -> log it as an activity so it counts
      await supabase.from("activities").insert({
        organization_id: modal.org.organization_id, activity_type: "other", outcome: "neutral",
        notes: body, logged_by: user?.id ?? null, source: "web",
      });
    } else if (modal.kind === "watch" && modal.org) {
      await supabase.from("huddle_items").insert({
        type: "watch", title: title || `Watch: ${modal.org.name}`, body: body || null,
        organization_id: modal.org.organization_id, origin_meeting_id: meetingId,
        goal_text: goal || null, expires_on: expires || null, owner_id: user?.id ?? null, created_by: user?.id ?? null,
      });
    } else {
      await supabase.from("huddle_items").insert({
        type, title, body: body || null, due_date: due || null,
        origin_meeting_id: meetingId, owner_id: user?.id ?? null, created_by: user?.id ?? null,
      });
    }
    setBusy(false); onDone();
  };

  const isWatch = modal.kind === "watch";
  const isNote = modal.kind === "note";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {isNote ? `Quick note — ${modal.org?.name ?? modal.item?.title}` : isWatch ? `Watch ${modal.org?.name}` : "New item"}
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        {!isNote && !isWatch && (
          <div className="mb-2 flex gap-1">
            {(["issue", "commitment", "watch"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`rounded-lg border px-2.5 py-1 text-[12px] font-semibold ${
                  type === t ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-500"}`}>{t}</button>
            ))}
          </div>
        )}

        {!isNote && (
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — be specific"
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
        )}

        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
          placeholder={isNote ? "What was said? No patient identifiers." : "Detail…"}
          className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200" />

        {isWatch && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal e.g. 2 referrals/mo"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        )}
        {!isNote && !isWatch && type === "commitment" && (
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        )}

        {isWatch && <p className="mb-2 text-[11px] text-amber-700">A watch needs a goal and an expiry, or the board fills with noise.</p>}

        <button disabled={busy || (!isNote && !title)} onClick={submit}
          className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
