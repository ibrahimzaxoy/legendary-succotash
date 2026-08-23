import { useEffect, useState } from 'react';
import {
  createShiftAssignment,
  createShiftTemplate,
  deactivateShiftTemplate,
  deleteShiftAssignment,
  fetchAttendanceRecords,
  fetchRoster,
  fetchShiftTemplates,
  fetchStaff,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import type { AttendanceRecord, ShiftAssignment, ShiftTemplate, Staff } from '../api/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function endOfWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 6);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const ATTENDANCE_STYLE: Record<string, string> = {
  present: 'bg-success/10 text-success',
  late: 'bg-cooking/10 text-cooking',
  early_leave: 'bg-cooking/10 text-cooking',
  unscheduled: 'bg-stone-100 text-muted',
  absent: 'bg-error/10 text-error',
};

function NewTemplateForm({ branchId, onDone }: { branchId: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createShiftTemplate({ branchId, name, startTime, endTime, daysOfWeek: days });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the shift template.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium">
          Start
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
        <label className="flex-1 text-sm font-medium">
          End
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">Days</p>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded px-2.5 py-1.5 text-xs font-semibold ${days.includes(i) ? 'bg-primary text-white' : 'bg-stone-100 text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !name}
        className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {submitting ? 'Creating…' : 'Create template'}
      </button>
    </div>
  );
}

function NewAssignmentForm({
  branchId,
  templates,
  staff,
  onDone,
}: {
  branchId: string;
  templates: ShiftTemplate[];
  staff: Staff[];
  onDone: () => void;
}) {
  const [staffId, setStaffId] = useState('');
  const [shiftTemplateId, setShiftTemplateId] = useState('');
  const [date, setDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createShiftAssignment({ branchId, staffId, shiftTemplateId, date });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t assign the shift.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Staff
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="mt-1 w-full rounded border border-border p-2">
          <option value="">Select…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.role})
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Shift
        <select value={shiftTemplateId} onChange={(e) => setShiftTemplateId(e.target.value)} className="mt-1 w-full rounded border border-border p-2">
          <option value="">Select…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.startTime}–{t.endTime})
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !staffId || !shiftTemplateId}
        className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {submitting ? 'Assigning…' : 'Assign shift'}
      </button>
    </div>
  );
}

export function ShiftsPage({ branchId }: { branchId: string }) {
  const [templates, setTemplates] = useState<ShiftTemplate[] | null>(null);
  const [roster, setRoster] = useState<ShiftAssignment[] | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[] | null>(null);
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetchShiftTemplates(branchId).then(setTemplates);
    fetchRoster(branchId, startOfWeek(), endOfWeek()).then(setRoster);
    fetchAttendanceRecords(branchId, today(), today()).then(setAttendance);
    fetchStaff(branchId).then(setStaff);
  };

  useEffect(() => {
    setTemplates(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const removeAssignment = async (id: string) => {
    setError(null);
    try {
      await deleteShiftAssignment(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t remove the shift.');
    }
  };

  if (!templates || !roster || !attendance || !staff) return <LoadingScreen label="Loading shifts…" />;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Shifts &amp; Attendance</h1>
      {error && <p className="mb-4 text-error">{error}</p>}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Shift templates</h2>
          <button onClick={() => setShowTemplateForm(true)} className="text-sm font-medium text-primary">
            + Add template
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted">
                    {t.startTime}–{t.endTime}
                  </p>
                  <p className="mt-1 text-xs text-muted">{t.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')}</p>
                </div>
                <button onClick={() => deactivateShiftTemplate(t.id).then(load)} className="text-xs text-error">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <p className="text-muted">No shift templates yet.</p>}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">This week's roster</h2>
          <button onClick={() => setShowAssignForm(true)} className="text-sm font-medium text-primary" disabled={templates.length === 0}>
            + Assign shift
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{a.date}</td>
                  <td className="px-4 py-3">{a.staff.fullName}</td>
                  <td className="px-4 py-3">{a.shiftTemplate.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeAssignment(a.id)} className="text-xs text-error">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No shifts scheduled this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Today's attendance</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Clock in</th>
                <th className="px-4 py-3">Clock out</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.staff.fullName}</td>
                  <td className="px-4 py-3">{new Date(r.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3">
                    {r.clockOutAt ? new Date(r.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3">{r.totalMinutesWorked != null ? (r.totalMinutesWorked / 60).toFixed(1) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${ATTENDANCE_STYLE[r.status]}`}>{r.status.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    No one has clocked in yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showTemplateForm && (
        <Modal title="New shift template" onClose={() => setShowTemplateForm(false)}>
          <NewTemplateForm
            branchId={branchId}
            onDone={() => {
              setShowTemplateForm(false);
              load();
            }}
          />
        </Modal>
      )}
      {showAssignForm && (
        <Modal title="Assign a shift" onClose={() => setShowAssignForm(false)}>
          <NewAssignmentForm
            branchId={branchId}
            templates={templates}
            staff={staff}
            onDone={() => {
              setShowAssignForm(false);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
