/**
 * HuddleBoard.tsx — Elevate Weekly Growth Huddle
 * src/pages/HuddleBoard.tsx   Route: /huddle
 *
 * One segment on screen at a time. Click through 1→6 as the meeting runs.
 * Deps: existing supabase client, lucide-react, tailwind. No shadcn required.
 *
 * PHI: never renders patient name, DOB, SSN, or Medicare number. Referrals show
 * as a short code + org + age. Click through to the referral page for detail.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Play, Square, Plus, ChevronRight, ChevronLeft, Clock, Target, TrendingUp,
  MessageSquarePlus, Link2, CheckCircle2, X, RefreshCw, Check, ArrowRight,
  Info, StickyNote,
} from "lucide-react";

const ORG_ROUTE = (id: string) => `/organizations/${id}`;
const REFERRAL_ROUTE = (id: string) => `/referral/${id}`;

const SEGMENTS = [
  { key: "wins", label: "Wins & Story", short: "Wins", minutes: 5,
    guide: [
      "One win each, one sentence. Round the table.",
      "One Story of the Week — a moment where Elevate did something a large hospice couldn't.",
      "Rotate the story owner monthly. Log keepers to the Story Library.",
    ],
    guard: "No names, no facility identifiers, no dates of service." },
  { key: "scorecard", label: "Scorecard", short: "Scorecard", minutes: 8,
    guide: [
      "Owner says the number and one word: on track, or off track.",
      "Type it into the tile as it's said. No explanation, no context.",
      "Every red becomes an issue in segment 5 — don't solve it here.",
    ],
    guard: "Sixteen metrics fit in eight minutes only if nobody explains." },
  { key: "pipeline", label: "Pipeline Board", short: "Pipeline", minutes: 10,
    guide: [
      "Jodie drives: new this week → stalled → assessment scheduled → lost.",
      "Every loss gets a coded reason before it leaves the screen.",
      "Name what admits this week and what clinical capacity it needs.",
    ],
    guard: "The lost-reason review is the most valuable three minutes here, and the first thing dropped when you run late." },
  { key: "roundrobin", label: "Territory Round-Robin", short: "Territory", minutes: 12,
    guide: [
      "4 minutes each — Susan, John, Jodie. Five prompts, same order:",
      "1. Last week's commitment: done or not. 2. One account that moved — name the account and the person.",
      "3. One account that's stuck — where's the block? 4. Top 3 targets this week. 5. What I need from this room.",
    ],
    guard: "Clinical objections go to Anneli live — she can commit to a joint visit on the spot." },
  { key: "issues", label: "Issues (IDS)", short: "Issues", minutes: 20,
    guide: [
      "Vote the top three off the list. Solve three completely rather than touching nine.",
      "Identify the real issue, not the symptom. Discuss once each.",
      "Solve means one owner, one action, one date.",
    ],
    guard: "“Just an update on…” is not an issue. Cut it off in ten seconds." },
  { key: "commit", label: "Commitments & Close", short: "Close", minutes: 5,
    guide: [
      "Each person: one number I own this week, one action I will take.",
      "Read the commitment list back out loud.",
      "Rate the meeting 1–10. Under 8 gets one sentence of why.",
    ],
    guard: "End on commitments, not on discussion." },
];

const CATEGORY_LABEL: Record<string, string> = {
  leading: "Leading — activity we control",
  pipeline: "Pipeline — the conversion engine",
  lagging: "Lagging — the result",
  meta: "Adoption",
};

const OPEN_STATUSES = ["new_referral", "in_progress", "pending", "contacted", "assessment_scheduled"];
const LOST_STATUSES = ["declined", "not_appropriate", "lost_to_followup", "closed"];

type Metric = { metric_key: string; label: string; category: string; owner_label: string | null;
  target_value: number | null; unit: string | null; direction: string; source_mode: string;
  sort_order: number; help_text: string | null };
type Snapshot = { id: string; meeting_id: string; metric_key: string; value: number | null;
  target_value: number | null; source: string; status: string | null; prior_value: number | null; note: string | null };
type OrgPulse = { organization_id: string; name: string; org_type: string | null; city: string | null;
  bd_tier: string | null; assigned_marketer: string | null; target_goal: string | null; target_rank: number | null;
  referrals_7d: number; referrals_30d: number; referrals_90d: number; open_referrals: number;
  activities_30d: number; days_since_touch: number | null; never_touched: boolean;
  last_next_step: string | null; last_next_step_date: string | null };
type Item = { id: string; type: "issue" | "commitment" | "watch"; status: string; title: string;
  body: string | null; owner_label: string | null; owner_name: string | null;
  organization_id: string | null; organization_name: string | null; due_date: string | null;
  goal_text: string | null; expires_on: string | null; carried_count: number; note_count: number;
  last_note: string | null; is_overdue: boolean; is_expired: boolean };
type Work = { id: string; ref_code: string; status: string; organization_name: string | null;
  organization_id: string | null; assigned_marketer: string | null; days_open: number; days_idle: number;
  is_stalled: boolean; loss_reason: string | null; created_at: string };
type Meeting = { id: string; meeting_date: string; status: string; avg_rating: number | null;
  segments_done: string[] | null; segment_notes: Record<string, string> | null };

const SOURCE_BADGE: Record<string, { dot: string; cls: string; title: string }> = {
  self_reported: { dot: "○", cls: "text-slate-400", title: "Self-reported — typed in at the meeting" },
  partial:       { dot: "◐", cls: "text-amber-500", title: "Partial — some system data, some manual" },
  system:        { dot: "●", cls: "text-teal-600", title: "System — pulled from the CRM" },
};

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const t: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600", teal: "bg-teal-50 text-teal-700",
    red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700", green: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${t[tone] ?? t.slate}`}>{children}</span>;
}

/* ---------------- metric tile (compact) ---------------- */
function MetricTile({ metric, snap, live, onSave }: {
  metric: Metric; snap?: Snapshot; live: boolean;
  onSave: (k: string, v: number | null, n: string | null, s: string) => void;
}) {
  const [val, setVal] = useState(snap?.value != null ? String(snap.value) : "");
  const [note, setNote] = useState(snap?.note ?? "");
  const [openNote, setOpenNote] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setVal(snap?.value != null ? String(snap.value) : "");
    setNote(snap?.note ?? ""); setDirty(false);
  }, [snap?.value, snap?.note]);

  const target = snap?.target_value ?? metric.target_value;
  const num = val === "" ? null : Number(val);
  const ok = num != null && target != null
    ? (metric.direction === "lower_better" ? num <= target : num >= target) : null;
  const delta = num != null && snap?.prior_value != null ? num - snap.prior_value : null;
  const badge = SOURCE_BADGE[snap?.source ?? metric.source_mode] ?? SOURCE_BADGE.self_reported;

  const commit = () => {
    if (!dirty) return;
    const src = snap?.source === "system" && num !== snap?.value ? "partial" : (snap?.source ?? metric.source_mode);
    onSave(metric.metric_key, num, note || null, src);
    setDirty(false);
  };

  const accent = ok === true ? "bg-emerald-400" : ok === false ? "bg-red-400" : "bg-slate-200";
  const numCls = ok === true ? "text-emerald-700" : ok === false ? "text-red-600" : "text-slate-800";

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white pl-3 pr-2.5 py-2.5">
      <span className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold leading-tight text-slate-800">{metric.label}</div>
          <div className="truncate text-[11px] text-slate-400">{metric.owner_label ?? "—"}</div>
        </div>
        <span className={`shrink-0 text-[12px] ${badge.cls}`} title={badge.title}>{badge.dot}</span>
      </div>

      <div className="mt-1.5 flex items-baseline gap-2">
        {live ? (
          <input inputMode="decimal" value={val} placeholder="—"
            onChange={(e) => { setVal(e.target.value); setDirty(true); }}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className={`w-16 rounded border border-transparent bg-slate-50 px-1.5 py-0.5 text-xl font-bold tabular-nums outline-none focus:border-sky-300 focus:bg-white ${numCls}`} />
        ) : (
          <span className={`text-xl font-bold tabular-nums ${numCls}`}>{val === "" ? "—" : val}</span>
        )}
        <span className="text-[11px] text-slate-400">
          {target != null ? `/ ${target}${metric.unit === "%" ? "%" : ""}` : ""}
        </span>
        {delta != null && delta !== 0 && (
          <span className={`text-[11px] font-semibold ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
          </span>
        )}
        {live && (
          <button onClick={() => setOpenNote((o) => !o)} title="Note"
            className={`ml-auto rounded p-1 hover:bg-slate-100 ${note ? "text-teal-600" : "text-slate-300"}`}>
            <StickyNote className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {live && openNote && (
        <input autoFocus value={note} placeholder="note…"
          onChange={(e) => { setNote(e.target.value); setDirty(true); }}
          onBlur={() => { commit(); if (!note) setOpenNote(false); }}
          className="mt-1.5 w-full rounded border border-slate-200 px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-teal-300" />
      )}
      {!live && snap?.note && <div className="mt-1 text-[11.5px] italic text-slate-500">{snap.note}</div>}
    </div>
  );
}

/* ---------------- org card ---------------- */
function OrgCard({ o, onNote, onWatch }: { o: OrgPulse; onNote: (o: OrgPulse) => void; onWatch: (o: OrgPulse) => void }) {
  const stale = o.never_touched || (o.days_since_touch ?? 999) > 30;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 hover:border-teal-300">
      <div className="flex items-start justify-between gap-2">
        <Link to={ORG_ROUTE(o.organization_id)} className="min-w-0 group">
          <div className="truncate text-[12.5px] font-semibold text-slate-800 group-hover:text-sky-700">{o.name}</div>
          <div className="truncate text-[11px] text-slate-400">
            {(o.org_type ?? "").replace(/_/g, " ")}{o.assigned_marketer ? ` · ${o.assigned_marketer}` : ""}
          </div>
        </Link>
        <div className="flex shrink-0 gap-0.5">
          <button onClick={() => onNote(o)} title="Quick note" className="rounded p-1 text-slate-400 hover:bg-slate-100"><MessageSquarePlus className="h-3.5 w-3.5" /></button>
          <button onClick={() => onWatch(o)} title="Add to board" className="rounded p-1 text-slate-400 hover:bg-slate-100"><Link2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <Pill tone={o.referrals_30d > 0 ? "teal" : "slate"}>{o.referrals_30d} · 30d</Pill>
        <Pill>{o.referrals_90d} · 90d</Pill>
        {o.open_referrals > 0 && <Pill tone="blue">{o.open_referrals} open</Pill>}
        <Pill tone={stale ? "red" : "green"}>{o.never_touched ? "never touched" : `${o.days_since_touch}d`}</Pill>
      </div>
      {o.target_goal && <div className="mt-1.5 truncate text-[11px] text-slate-500"><Target className="mr-1 inline h-3 w-3" />{o.target_goal}</div>}
      {o.last_next_step && <div className="mt-0.5 truncate text-[11px] text-slate-500"><ChevronRight className="inline h-3 w-3" />{o.last_next_step}</div>}
    </div>
  );
}

/* ---------------- item row ---------------- */
function ItemRow({ item, live, onNote, onResolve }: {
  item: Item; live: boolean; onNote: (i: Item) => void; onResolve: (i: Item) => void;
}) {
  const tone = item.type === "issue" ? "red" : item.type === "commitment" ? "blue" : "teal";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <Pill tone={tone}>{item.type}</Pill>
            {item.carried_count > 0 && (
              <Pill tone={item.carried_count >= 3 ? "red" : "amber"}>
                carried {item.carried_count}{item.carried_count >= 3 ? " — decide" : ""}
              </Pill>
            )}
            {item.is_overdue && <Pill tone="red">overdue</Pill>}
            {item.is_expired && <Pill tone="amber">expired</Pill>}
            {item.organization_name && item.organization_id && (
              <Link to={ORG_ROUTE(item.organization_id)} className="text-[11px] font-semibold text-sky-700 hover:underline">{item.organization_name}</Link>
            )}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-slate-800">{item.title}</div>
          {item.body && <div className="text-[12px] text-slate-600">{item.body}</div>}
          <div className="mt-0.5 text-[11px] text-slate-400">
            {item.owner_name ?? item.owner_label ?? "unassigned"}
            {item.due_date ? ` · due ${item.due_date}` : ""}
            {item.goal_text ? ` · ${item.goal_text}` : ""}
            {item.expires_on ? ` · expires ${item.expires_on}` : ""}
          </div>
          {item.last_note && <div className="mt-1 rounded bg-slate-50 px-2 py-1 text-[11px] italic text-slate-600">“{item.last_note}”{item.note_count > 1 ? ` · ${item.note_count} notes` : ""}</div>}
        </div>
        {live && (
          <div className="flex shrink-0 gap-0.5">
            <button onClick={() => onNote(item)} title="Add note" className="rounded p-1 text-slate-400 hover:bg-slate-100"><MessageSquarePlus className="h-3.5 w-3.5" /></button>
            <button onClick={() => onResolve(item)} title="Resolve" className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- worklist row (de-identified) ---------------- */
function WorkRow({ w }: { w: Work }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 last:border-0 hover:bg-slate-50">
      <Link to={REFERRAL_ROUTE(w.id)} className="font-mono text-[11.5px] font-bold text-sky-700 hover:underline">{w.ref_code}</Link>
      {w.organization_id ? (
        <Link to={ORG_ROUTE(w.organization_id)} className="truncate text-[12px] text-slate-700 hover:underline">{w.organization_name ?? "—"}</Link>
      ) : <span className="truncate text-[12px] text-slate-400">no org</span>}
      <span className="ml-auto shrink-0"><Pill tone="slate">{w.status.replace(/_/g, " ")}</Pill></span>
      <span className="shrink-0"><Pill tone={w.days_idle > 3 ? "red" : "slate"}>{w.days_idle}d idle</Pill></span>
      {w.assigned_marketer && <span className="hidden shrink-0 text-[11px] text-slate-400 sm:inline">{w.assigned_marketer}</span>}
    </div>
  );
}

function Panel({ title, count, tone = "slate", children }: { title: string; count?: number; tone?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        {count != null && <Pill tone={tone}>{count}</Pill>}
      </div>
      <div className="max-h-[380px] overflow-y-auto">{children}</div>
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
  const [work, setWork] = useState<Work[]>([]);
  const [seg, setSeg] = useState(0);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<string[]>([]);
  const [segNotes, setSegNotes] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [modal, setModal] = useState<null | { kind: "note" | "watch" | "item"; org?: OrgPulse; item?: Item }>(null);

  const live = meeting?.status === "live";
  const segKey = SEGMENTS[seg].key;

  useEffect(() => { if (!running) return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [running]);
  const over = secs > SEGMENTS[seg].minutes * 60;

  const loadAll = useCallback(async (meetingId?: string) => {
    const [{ data: m }, { data: prod }, { data: tgt }, { data: it }, { data: wk }] = await Promise.all([
      supabase.from("huddle_metrics").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("v_huddle_top_producers").select("*").order("referrals_90d", { ascending: false }).limit(8),
      supabase.from("v_huddle_target_accounts").select("*").order("target_rank", { ascending: true, nullsFirst: false }).limit(8),
      supabase.from("v_huddle_open_items").select("*").order("carried_count", { ascending: false }),
      supabase.from("v_huddle_worklist").select("*").order("days_idle", { ascending: false }).limit(400),
    ]);
    setMetrics((m as Metric[]) ?? []);
    setProducers((prod as OrgPulse[]) ?? []);
    setTargets((tgt as OrgPulse[]) ?? []);
    setItems((it as Item[]) ?? []);
    setWork((wk as Work[]) ?? []);
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
      const { data: mt } = await supabase.from("huddle_meetings").select("*").order("meeting_date", { ascending: false }).limit(1).maybeSingle();
      const m = (mt as Meeting) ?? null;
      setMeeting(m); setDone(m?.segments_done ?? []); setSegNotes(m?.segment_notes ?? {});
      await loadAll(m?.id);
      setLoading(false);
    })();
  }, [loadAll]);

  useEffect(() => { setNoteDraft(segNotes[segKey] ?? ""); }, [segKey, segNotes]);

  const openMeeting = async () => {
    const { data, error } = await supabase.rpc("fn_huddle_open_meeting", { p_date: new Date().toISOString().slice(0, 10) });
    if (error) return alert(error.message);
    const { data: mt } = await supabase.from("huddle_meetings").select("*").eq("id", data as string).single();
    const m = mt as Meeting;
    setMeeting(m); setDone(m?.segments_done ?? []); setSegNotes(m?.segment_notes ?? {});
    setRunning(true); setSeg(0); setSecs(0);
    await loadAll(data as string);
  };

  const closeMeeting = async () => {
    if (!meeting) return;
    if (!confirm("Close the meeting? The scorecard and all notes freeze.")) return;
    const { error } = await supabase.rpc("fn_huddle_close_meeting", { p_meeting_id: meeting.id });
    if (error) return alert(error.message);
    setRunning(false);
    const { data: mt } = await supabase.from("huddle_meetings").select("*").eq("id", meeting.id).single();
    setMeeting(mt as Meeting);
    await loadAll(meeting.id);
  };

  const persist = async (nextDone: string[], nextNotes: Record<string, string>) => {
    if (!meeting) return;
    setDone(nextDone); setSegNotes(nextNotes);
    await supabase.from("huddle_meetings")
      .update({ segments_done: nextDone, segment_notes: nextNotes, updated_at: new Date().toISOString() })
      .eq("id", meeting.id);
  };
  const saveSegNote = async () => {
    if ((segNotes[segKey] ?? "") === noteDraft) return;
    await persist(done, { ...segNotes, [segKey]: noteDraft });
  };
  const toggleDone = async () => {
    await persist(done.includes(segKey) ? done.filter((k) => k !== segKey) : [...done, segKey], { ...segNotes, [segKey]: noteDraft });
  };
  const go = (i: number) => { if (i < 0 || i >= SEGMENTS.length) return; setSeg(i); setSecs(0); };
  const nextSeg = async () => {
    await persist(done.includes(segKey) ? done : [...done, segKey], { ...segNotes, [segKey]: noteDraft });
    if (seg < SEGMENTS.length - 1) { go(seg + 1); setRunning(true); }
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
    const v = Object.values(snaps).filter((s) => s.metric_key !== "pct_system_data");
    return v.length ? Math.round((v.filter((s) => s.source === "system").length / v.length) * 100) : 0;
  }, [snaps]);

  const newThisWeek = useMemo(() => work.filter((w) => (Date.now() - new Date(w.created_at).getTime()) < 7 * 864e5), [work]);
  const stalled = useMemo(() => work.filter((w) => w.is_stalled && OPEN_STATUSES.includes(w.status)), [work]);
  const scheduled = useMemo(() => work.filter((w) => w.status === "assessment_scheduled"), [work]);
  const lost = useMemo(() => work.filter((w) => LOST_STATUSES.includes(w.status) && (Date.now() - new Date(w.created_at).getTime()) < 14 * 864e5), [work]);

  if (loading) return <div className="p-8 text-slate-500">Loading huddle…</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-2.5">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-widest text-teal-600">Weekly Growth Huddle</div>
            <div className="flex items-center gap-2 text-[17px] font-bold text-slate-900">
              {meeting ? new Date(meeting.meeting_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "No meeting yet"}
              {meeting && <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{meeting.status}</span>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-500 sm:block">
              system data <b className="text-slate-900">{systemPct}%</b>
            </div>
            <button onClick={() => loadAll(meeting?.id)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><RefreshCw className="h-4 w-4 text-slate-400" /></button>
            {!live ? (
              <button onClick={openMeeting} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-teal-700"><Play className="h-4 w-4" /> Start</button>
            ) : (
              <button onClick={closeMeeting} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-800"><Square className="h-4 w-4" /> Close &amp; freeze</button>
            )}
          </div>
        </div>

        {live && (
          <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-5 pb-2">
            {SEGMENTS.map((s, i) => {
              const isDone = done.includes(s.key), isActive = i === seg;
              return (
                <button key={s.key} onClick={() => go(i)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-[12px] font-medium transition ${
                    isActive ? "border-teal-400 bg-teal-50 text-teal-900 ring-1 ring-teal-200"
                    : isDone ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone ? "bg-emerald-600 text-white" : isActive ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {isDone ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.short}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">{done.length}/6</span>
              <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[12px] font-bold tabular-nums ${over ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 text-slate-600"}`}>
                <Clock className="h-3.5 w-3.5" />
                {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
                <button onClick={() => setRunning((r) => !r)} className="ml-1 text-[10.5px] font-medium underline">{running ? "pause" : "run"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-4">
        {!meeting && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-slate-600">No huddle open yet.</div>
            <button onClick={openMeeting} className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Start this week's huddle</button>
          </div>
        )}

        {meeting && !live && (
          <div className="mb-4 rounded-lg border-l-4 border-slate-400 bg-white px-4 py-3 text-[13px] text-slate-600">
            This meeting is closed and frozen. Everything below is read-only. Press <b>Start</b> to open this week's.
          </div>
        )}

        {/* ---------- SEGMENT HEADER ---------- */}
        {meeting && live && (
          <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">{seg + 1}</span>
              <div className="text-[14px] font-bold text-slate-900">{SEGMENTS[seg].label}</div>
              <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">{SEGMENTS[seg].minutes} min</span>
              <div className="ml-auto flex items-center gap-1.5">
                <button onClick={() => go(seg - 1)} disabled={seg === 0} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-25 hover:bg-slate-50"><ChevronLeft className="h-4 w-4 text-slate-500" /></button>
                <button onClick={toggleDone}
                  className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold ${done.includes(segKey) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {done.includes(segKey) ? "✓ Done" : "Mark done"}
                </button>
                <button onClick={nextSeg} disabled={seg >= SEGMENTS.length - 1}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-25">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-[1.4fr_1fr]">
              <div>
                <ul className="space-y-1">
                  {SEGMENTS[seg].guide.map((g, i) => (
                    <li key={i} className="flex gap-1.5 text-[12.5px] text-slate-700">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" /><span>{g}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-1.5 rounded border-l-[3px] border-amber-400 bg-amber-50 px-2.5 py-1.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span className="text-[12px] text-amber-900">{SEGMENTS[seg].guard}</span>
                </div>
              </div>
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onBlur={saveSegNote} rows={5}
                placeholder={`Notes for ${SEGMENTS[seg].label} — no patient identifiers`}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-teal-300" />
            </div>
          </div>
        )}

        {/* ---------- SEGMENT CONTENT ---------- */}
        {meeting && (segKey === "scorecard" || !live) && (
          <>
            {["leading", "pipeline", "lagging", "meta"].map((cat) => (grouped[cat]?.length ? (
              <section key={cat} className="mb-4">
                <h2 className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-teal-600">{CATEGORY_LABEL[cat]}</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {grouped[cat].map((m) => <MetricTile key={m.metric_key} metric={m} snap={snaps[m.metric_key]} live={live} onSave={saveMetric} />)}
                </div>
              </section>
            ) : null))}
          </>
        )}

        {meeting && live && segKey === "pipeline" && (
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="New this week" count={newThisWeek.length} tone="teal">
              {newThisWeek.length ? newThisWeek.map((w) => <WorkRow key={w.id} w={w} />) : <div className="p-4 text-[12.5px] text-slate-400">Nothing new.</div>}
            </Panel>
            <Panel title="Stalled — past 72h" count={stalled.length} tone="red">
              {stalled.length ? stalled.map((w) => <WorkRow key={w.id} w={w} />) : <div className="p-4 text-[12.5px] text-slate-400">Clear.</div>}
            </Panel>
            <Panel title="Assessment scheduled" count={scheduled.length} tone="blue">
              {scheduled.length ? scheduled.map((w) => <WorkRow key={w.id} w={w} />) : <div className="p-4 text-[12.5px] text-slate-400">None scheduled.</div>}
            </Panel>
            <Panel title="Lost — last 14 days" count={lost.length} tone="amber">
              {lost.length ? lost.map((w) => (
                <div key={w.id} className="border-b border-slate-100 px-3 py-1.5 last:border-0">
                  <WorkRow w={w} />
                  <div className={`px-1 pb-1 text-[11px] ${w.loss_reason ? "text-slate-500" : "font-semibold text-red-500"}`}>
                    {w.loss_reason ? `reason: ${w.loss_reason}` : "⚠ no reason coded — code it before moving on"}
                  </div>
                </div>
              )) : <div className="p-4 text-[12.5px] text-slate-400">No losses.</div>}
            </Panel>
          </div>
        )}

        {meeting && live && segKey === "roundrobin" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section>
              <h2 className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-teal-600"><TrendingUp className="mr-1 inline h-3.5 w-3.5" />Top producers — protect these</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {producers.map((o) => <OrgCard key={o.organization_id} o={o} onNote={(x) => setModal({ kind: "note", org: x })} onWatch={(x) => setModal({ kind: "watch", org: x })} />)}
              </div>
            </section>
            <section>
              <h2 className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-amber-600"><Target className="mr-1 inline h-3.5 w-3.5" />Target accounts — convert these</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {targets.map((o) => <OrgCard key={o.organization_id} o={o} onNote={(x) => setModal({ kind: "note", org: x })} onWatch={(x) => setModal({ kind: "watch", org: x })} />)}
              </div>
            </section>
          </div>
        )}

        {meeting && live && (segKey === "issues" || segKey === "commit" || segKey === "wins") && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-teal-600">
                {segKey === "commit" ? "Commitments" : segKey === "wins" ? "Carried forward — for context" : "Issues, commitments & watches"}
              </h2>
              <button onClick={() => setModal({ kind: "item" })} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {(segKey === "commit" ? items.filter((i) => i.type === "commitment") : items).length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-[12.5px] text-slate-400">Nothing open.</div>
              )}
              {(segKey === "commit" ? items.filter((i) => i.type === "commitment") : items).map((i) => (
                <ItemRow key={i.id} item={i} live={live}
                  onNote={(x) => setModal({ kind: "note", item: x })}
                  onResolve={async (x) => { await supabase.from("huddle_items").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", x.id); loadAll(meeting.id); }} />
              ))}
            </div>
          </section>
        )}
      </div>

      {modal && <QuickModal modal={modal} meetingId={meeting?.id ?? null} onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(meeting?.id); }} />}
    </div>
  );
}

/* ---------------- modal ---------------- */
function QuickModal({ modal, meetingId, onClose, onDone }: {
  modal: { kind: "note" | "watch" | "item"; org?: OrgPulse; item?: Item };
  meetingId: string | null; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"issue" | "commitment" | "watch">("issue");
  const [due, setDue] = useState(""); const [goal, setGoal] = useState(""); const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const isWatch = modal.kind === "watch", isNote = modal.kind === "note";

  const submit = async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (isNote && modal.item) {
      await supabase.from("huddle_item_notes").insert({ item_id: modal.item.id, meeting_id: meetingId, author_id: user?.id ?? null, body });
    } else if (isNote && modal.org) {
      await supabase.from("activities").insert({ organization_id: modal.org.organization_id, activity_type: "other", outcome: "neutral", notes: body, logged_by: user?.id ?? null, source: "web" });
    } else if (isWatch && modal.org) {
      await supabase.from("huddle_items").insert({ type: "watch", title: title || `Watch: ${modal.org.name}`, body: body || null,
        organization_id: modal.org.organization_id, origin_meeting_id: meetingId, goal_text: goal || null,
        expires_on: expires || null, owner_id: user?.id ?? null, created_by: user?.id ?? null });
    } else {
      await supabase.from("huddle_items").insert({ type, title, body: body || null, due_date: due || null,
        origin_meeting_id: meetingId, owner_id: user?.id ?? null, created_by: user?.id ?? null });
    }
    setBusy(false); onDone();
  };

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
                className={`rounded-lg border px-2.5 py-1 text-[12px] font-semibold ${type === t ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-500"}`}>{t}</button>
            ))}
          </div>
        )}
        {!isNote && <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — be specific"
          className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200" />}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
          placeholder={isNote ? "What was said? No patient identifiers." : "Detail…"}
          className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
        {isWatch && (
          <>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal e.g. 2 referrals/mo" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <p className="mb-2 text-[11px] text-amber-700">A watch needs a goal and an expiry, or the board fills with noise.</p>
          </>
        )}
        {!isNote && !isWatch && type === "commitment" && (
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        )}
        <button disabled={busy || (!isNote && !title)} onClick={submit}
          className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
