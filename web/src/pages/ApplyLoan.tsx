import { useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import { useSession } from '../context/SessionContext';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { FallbackNotice } from '../components/FallbackNotice';
import { StatusStamp } from '../components/StatusStamp';
import { Rupee } from '../components/Rupee';
import type { Loan } from '../types';

export function ApplyLoan() {
  const { currentMember } = useSession();
  const { term, termId, loading: termLoading } = useActiveTerm();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [result, setResult] = useState<Loan | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember || !termId) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const loan = await api.loans.apply({
        memberId: currentMember.id,
        termId,
        amount: Number(amount),
      });
      setResult(loan);
      setAmount('');
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setError({ code: e.errorCode, message: e.message });
      } else {
        setError({ code: 'UNKNOWN', message: 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (termLoading) return <p className="text-ledger-ink-soft">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-ledger-ink-soft mb-1">Apply for a loan</p>
        <h2 className="font-display text-2xl font-semibold text-ledger-green-deep">{term?.termName ?? 'No active term'}</h2>
      </div>

      {!termId ? (
        <p className="text-ledger-ink-soft">There's no active term open for applications right now.</p>
      ) : (
        <form onSubmit={submit} className="bg-ledger-card border border-ledger-line rounded-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-ledger-ink-soft mb-1">Applying as</label>
            <p className="font-medium">{currentMember?.name ?? '—'}</p>
          </div>

          <div>
            <label className="block text-sm text-ledger-ink-soft mb-1" htmlFor="amount">
              Amount requested (max ₹2,00,000)
            </label>
            <input
              id="amount"
              type="number"
              required
              min={1}
              max={200000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-ledger-line rounded px-3 py-2 bg-ledger-bg font-mono"
              placeholder="e.g. 50000"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-ledger-green text-ledger-card px-5 py-2 rounded-sm font-medium hover:bg-ledger-green-deep transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      )}

      {error && <FallbackNotice code={error.code} message={error.message} />}

      {result && (
        <div className="bg-ledger-card border border-ledger-sage rounded-sm p-5 flex items-start gap-4">
          <StatusStamp status={result.status} />
          <div>
            <p className="text-ledger-ink">
              Your application for <Rupee value={result.amount} className="font-semibold" /> has been recorded.
            </p>
            <p className="text-sm text-ledger-ink-soft mt-1">
              It's queued for admin approval based on the group's priority order — check the Ledger tab to see where you stand.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
