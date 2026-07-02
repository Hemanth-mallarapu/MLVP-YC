import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import { useSession } from '../context/SessionContext';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { Rupee } from '../components/Rupee';
import { FallbackNotice } from '../components/FallbackNotice';
import type { Contribution } from '../types';

export function Contributions() {
  const { currentMember } = useSession();
  const { term, termId, loading: termLoading } = useActiveTerm();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('1');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!termId || !currentMember) return;
    setLoading(true);
    api.contributions
      .byTerm(termId, currentMember.id)
      .then(setContributions)
      .finally(() => setLoading(false));
  };

  useEffect(load, [termId, currentMember?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termId || !currentMember || !term) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.contributions.add(termId, {
        monthNumber: Number(month),
        amount: term.monthlyContribution,
        status: 'PAID',
        paidDate: new Date().toISOString().slice(0, 10),
        member: { id: currentMember.id },
        term: { id: termId },
      });
      load();
    } catch (e) {
      if (e instanceof ApiRequestError) setError({ code: e.errorCode, message: e.message });
      else setError({ code: 'UNKNOWN', message: 'Could not record contribution.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (termLoading) return <p className="text-ledger-ink-soft">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-ledger-ink-soft mb-1">{term?.termName}</p>
        <h2 className="font-display text-2xl font-semibold text-ledger-green-deep">Your contributions</h2>
      </div>

      {loading ? (
        <p className="text-ledger-ink-soft text-sm">Loading…</p>
      ) : contributions.length === 0 ? (
        <p className="text-ledger-ink-soft text-sm border border-dashed border-ledger-line rounded p-4">
          No contributions recorded yet this term.
        </p>
      ) : (
        <div className="bg-ledger-card border border-ledger-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ledger-line text-left text-ledger-ink-soft uppercase text-xs tracking-wide">
                <th className="px-4 py-2 font-medium">Month</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium">Paid on</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr key={c.id} className="border-b border-ledger-line last:border-0">
                  <td className="px-4 py-2">Month {c.monthNumber}</td>
                  <td className="px-4 py-2 text-right"><Rupee value={c.amount} /></td>
                  <td className="px-4 py-2 text-ledger-ink-soft">{c.paidDate}</td>
                  <td className="px-4 py-2 text-ledger-ink-soft">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="font-display text-lg font-semibold text-ledger-green-deep mb-3">Record a payment</h3>
        <form onSubmit={submit} className="bg-ledger-card border border-ledger-line rounded-sm p-6 space-y-4 max-w-sm">
          <div>
            <label className="block text-sm text-ledger-ink-soft mb-1">Month number (1–6)</label>
            <input
              type="number"
              min={1}
              max={6}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border border-ledger-line rounded px-3 py-2 bg-ledger-bg font-mono"
            />
          </div>
          <p className="text-sm text-ledger-ink-soft">
            Amount: <Rupee value={term?.monthlyContribution ?? 0} />
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="bg-ledger-green text-ledger-card px-5 py-2 rounded-sm font-medium hover:bg-ledger-green-deep disabled:opacity-50"
          >
            {submitting ? 'Recording…' : 'Mark as paid'}
          </button>
        </form>
        {error && <div className="mt-4"><FallbackNotice code={error.code} message={error.message} /></div>}
      </div>
    </div>
  );
}
