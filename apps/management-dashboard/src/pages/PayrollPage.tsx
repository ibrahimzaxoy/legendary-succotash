import { useEffect, useState } from 'react';
import {
  addPayrollAdjustment,
  fetchPayrollAdvances,
  fetchPayrollLines,
  fetchPayrollRuns,
  fetchStaff,
  finalizePayrollRun,
  generatePayrollRun,
  issueAdvance,
  markPayrollRunPaid,
  setPayRate,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import type { PayrollAdvance, PayrollLine, PayrollRun, Staff } from '../api/types';

function formatMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const RUN_STYLE: Record<string, string> = {
  draft: 'bg-stone-100 text-muted',
  finalized: 'bg-cooking/10 text-cooking',
  paid: 'bg-success/10 text-success',
};

function SetRateForm({ staff, onDone }: { staff: Staff[]; onDone: () => void }) {
  const [staffId, setStaffId] = useState('');
  const [payType, setPayType] = useState<'hourly' | 'monthly'>('hourly');
  const [baseRate, setBaseRate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await setPayRate({ staffId, payType, baseRate, effectiveFrom: today() });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t set the pay rate.');
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
              {s.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Pay type
        <select value={payType} onChange={(e) => setPayType(e.target.value as 'hourly' | 'monthly')} className="mt-1 w-full rounded border border-border p-2">
          <option value="hourly">Hourly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        {payType === 'hourly' ? 'Rate per hour' : 'Monthly base pay'}
        <input value={baseRate} onChange={(e) => setBaseRate(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !staffId || !baseRate} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Saving…' : 'Save rate'}
      </button>
    </div>
  );
}

function AdvancesPanel({ staff, branchId }: { staff: Staff[]; branchId: string }) {
  const [staffId, setStaffId] = useState('');
  const [advances, setAdvances] = useState<PayrollAdvance[] | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId) {
      setAdvances(null);
      return;
    }
    fetchPayrollAdvances(staffId).then(setAdvances);
  }, [staffId]);

  const issue = async () => {
    setError(null);
    try {
      await issueAdvance({ staffId, branchId, amount, reason: reason || undefined });
      setAmount('');
      setReason('');
      fetchPayrollAdvances(staffId).then(setAdvances);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t issue the advance.');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <label className="text-sm font-medium">
        Staff
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="mt-1 w-full rounded border border-border p-2">
          <option value="">Select…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>
      </label>

      {staffId && (
        <>
          <div className="mt-3 flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-32 rounded border border-border p-2 text-sm" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="flex-1 rounded border border-border p-2 text-sm" />
            <button onClick={issue} disabled={!amount} className="rounded bg-primary px-3 text-sm font-semibold text-white disabled:opacity-40">
              Issue
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}

          <div className="mt-3 flex flex-col gap-1.5">
            {advances?.map((a) => (
              <div key={a.id} className="flex justify-between rounded bg-surface px-3 py-2 text-sm">
                <span>
                  {formatMoney(a.amount)} {a.reason && `— ${a.reason}`}
                </span>
                <span className={a.status === 'settled' ? 'text-success' : 'text-muted'}>
                  {formatMoney(a.remainingBalance)} remaining · {a.status}
                </span>
              </div>
            ))}
            {advances && advances.length === 0 && <p className="text-sm text-muted">No advances issued yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function GenerateRunForm({ branchId, onDone }: { branchId: string; onDone: () => void }) {
  const [periodStart, setPeriodStart] = useState(today());
  const [periodEnd, setPeriodEnd] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await generatePayrollRun({ branchId, periodStart, periodEnd });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t generate the run.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium">
          Period start
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
        <label className="flex-1 text-sm font-medium">
          Period end
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
      </div>
      <p className="text-xs text-muted">
        Generates a draft line for every staff member with a pay rate set, using their attendance hours for this period.
      </p>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Generating…' : 'Generate draft'}
      </button>
    </div>
  );
}

function RunDetail({ run, onChanged }: { run: PayrollRun; onChanged: () => void }) {
  const [lines, setLines] = useState<PayrollLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjustingLine, setAdjustingLine] = useState<string | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState<'bonus' | 'deduction'>('bonus');

  const load = () => fetchPayrollLines(run.id).then(setLines);
  useEffect(() => {
    setLines(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id]);

  const submitAdjustment = async () => {
    if (!adjustingLine) return;
    setError(null);
    try {
      await addPayrollAdjustment(adjustingLine, { type: adjType, amount: adjAmount });
      setAdjustingLine(null);
      setAdjAmount('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t add the adjustment.');
    }
  };

  const finalize = async () => {
    setError(null);
    try {
      await finalizePayrollRun(run.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t finalize the run.');
    }
  };

  const markPaid = async () => {
    setError(null);
    try {
      await markPayrollRunPaid(run.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t mark the run paid.');
    }
  };

  if (!lines) return <LoadingScreen label="Loading payslips…" />;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">
          {run.periodStart} – {run.periodEnd}
        </h3>
        <div className="flex gap-2">
          {run.status === 'draft' && (
            <button onClick={finalize} className="rounded bg-primary px-3 py-1.5 text-sm font-semibold text-white">
              Finalize
            </button>
          )}
          {run.status === 'finalized' && (
            <button onClick={markPaid} className="rounded bg-success px-3 py-1.5 text-sm font-semibold text-white">
              Mark paid
            </button>
          )}
        </div>
      </div>
      {error && <p className="mb-2 text-sm text-error">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="py-2">Staff</th>
            <th className="py-2">Hours</th>
            <th className="py-2">OT hrs</th>
            <th className="py-2">Base</th>
            <th className="py-2">OT pay</th>
            <th className="py-2">Bonus</th>
            <th className="py-2">Deduction</th>
            <th className="py-2">Advance</th>
            <th className="py-2">Net pay</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="py-2">{l.staff.fullName}</td>
              <td className="py-2">{l.hoursWorked}</td>
              <td className="py-2">{l.overtimeHours}</td>
              <td className="py-2">{formatMoney(l.basePayAmount)}</td>
              <td className="py-2">{formatMoney(l.overtimeAmount)}</td>
              <td className="py-2">{formatMoney(l.bonusAmount)}</td>
              <td className="py-2">{formatMoney(l.deductionAmount)}</td>
              <td className="py-2">{formatMoney(l.advanceDeductionAmount)}</td>
              <td className="py-2 font-semibold">{formatMoney(l.netPay)}</td>
              <td className="py-2 text-right">
                {run.status === 'draft' &&
                  (adjustingLine === l.id ? (
                    <div className="flex items-center gap-1">
                      <select value={adjType} onChange={(e) => setAdjType(e.target.value as 'bonus' | 'deduction')} className="rounded border border-border p-1 text-xs">
                        <option value="bonus">Bonus</option>
                        <option value="deduction">Deduction</option>
                      </select>
                      <input value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} placeholder="Amt" className="w-16 rounded border border-border p-1 text-xs" />
                      <button onClick={submitAdjustment} className="text-xs font-semibold text-primary">
                        Add
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAdjustingLine(l.id)} className="text-xs text-primary">
                      + Adjust
                    </button>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PayrollPage({ branchId }: { branchId: string }) {
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [runs, setRuns] = useState<PayrollRun[] | null>(null);
  const [showRateForm, setShowRateForm] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const load = () => {
    fetchStaff(branchId).then(setStaff);
    fetchPayrollRuns(branchId).then(setRuns);
  };

  useEffect(() => {
    setRuns(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!staff || !runs) return <LoadingScreen label="Loading payroll…" />;

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Payroll</h1>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Pay rates</h2>
          <button onClick={() => setShowRateForm(true)} className="text-sm font-medium text-primary">
            + Set rate
          </button>
        </div>
        <p className="text-sm text-muted">Set a base pay rate per staff member before generating a payroll run for them.</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold">Advances &amp; loans</h2>
        <AdvancesPanel staff={staff} branchId={branchId} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Payroll runs</h2>
          <button onClick={() => setShowRunForm(true)} className="text-sm font-medium text-primary">
            + Generate run
          </button>
        </div>
        <div className="mb-4 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Generated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map((r) => (
                <tr key={r.id} className={selectedRunId === r.id ? 'bg-primary/5' : ''}>
                  <td className="px-4 py-3">
                    {r.periodStart} – {r.periodEnd}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${RUN_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">{new Date(r.generatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedRunId(r.id)} className="text-xs font-medium text-primary">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No payroll runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedRun && <RunDetail run={selectedRun} onChanged={load} />}
      </section>

      {showRateForm && (
        <Modal title="Set pay rate" onClose={() => setShowRateForm(false)}>
          <SetRateForm staff={staff} onDone={() => setShowRateForm(false)} />
        </Modal>
      )}
      {showRunForm && (
        <Modal title="Generate payroll run" onClose={() => setShowRunForm(false)}>
          <GenerateRunForm
            branchId={branchId}
            onDone={() => {
              setShowRunForm(false);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
