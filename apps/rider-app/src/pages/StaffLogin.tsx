import { useEffect, useState } from 'react';
import { fetchStaffLoginOptions, loginWithPin } from '../api/endpoints';
import { ApiError } from '../api/client';
import { setStaffSession } from '../state/store';
import { NumPad } from '../components/NumPad';
import { LoadingScreen } from '../components/LoadingScreen';
import type { Device } from '../utils/storage';
import type { StaffLoginOption } from '../api/types';

const PIN_LENGTH = 4;

// Every shift: a driver taps their own name on the shared login-options
// list (the branch's own PIN roster, which also includes waiters/cashiers/
// kitchen staff), then enters their PIN. Filtered to riders client-side so
// a driver's phone only ever shows other drivers, not the whole roster.
export function StaffLogin({ device }: { device: Device }) {
  const [options, setOptions] = useState<StaffLoginOption[] | null>(null);
  const [selected, setSelected] = useState<StaffLoginOption | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaffLoginOptions(device.branchId)
      .then((all) => setOptions(all.filter((o) => o.role === 'rider')))
      .catch(() => setError('Couldn’t load driver list.'));
  }, [device.branchId]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || !selected) return;
    setSubmitting(true);
    setError(null);
    loginWithPin(selected.id, pin)
      .then((tokens) => {
        setStaffSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, staff: tokens.staff });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Couldn’t reach the server.');
        setPin('');
      })
      .finally(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const deselect = () => {
    setSelected(null);
    setPin('');
    setError(null);
  };

  if (selected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <button onClick={deselect} className="mb-6 text-muted">
          ← Not {selected.fullName}?
        </button>
        <h1 className="mb-1 font-heading text-2xl font-bold">Hi, {selected.fullName.split(' ')[0]}</h1>
        <p className="mb-6 text-muted">Enter your PIN</p>
        <div className="mb-6 flex gap-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`h-4 w-4 rounded-pill ${i < pin.length ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        {error && <p className="mb-4 text-error">{error}</p>}
        {submitting ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        ) : (
          <div className="w-full max-w-xs">
            <NumPad onDigit={(d) => pin.length < PIN_LENGTH && setPin(pin + d)} onBackspace={() => setPin(pin.slice(0, -1))} />
          </div>
        )}
      </div>
    );
  }

  if (error && !options) return <div className="p-8 text-center text-error">{error}</div>;
  if (!options) return <LoadingScreen label="Loading drivers…" />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-1 text-center font-heading text-2xl font-bold">{device.branchName}</h1>
      <p className="mb-8 text-center text-muted">Who’s driving?</p>
      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option)}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-6 active:bg-primary-light/40"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-pill bg-primary-light text-xl font-bold text-primary-dark">
              {option.fullName
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
            <span className="text-lg font-medium">{option.fullName}</span>
          </button>
        ))}
        {options.length === 0 && (
          <p className="col-span-full text-center text-muted">
            No drivers set up for this branch yet - add some (role: Rider) from the Management Dashboard first.
          </p>
        )}
      </div>
    </div>
  );
}
