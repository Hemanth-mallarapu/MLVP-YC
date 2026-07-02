import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import { useSession } from '../context/SessionContext';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { StatusStamp } from '../components/StatusStamp';
import { Rupee } from '../components/Rupee';
import { FallbackNotice } from '../components/FallbackNotice';
import type { Loan } from '../types';

export function Loans() {
  const { currentMember } = useSession();
  const { termId, loading: termLoading } = useActiveTerm();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<{ code: string; message: string } | null>(null);
  const [repayAmount, setRepayAmount] = useState<Record<number, string>>({});

  const isAdmin = currentMember?.role === 'ADMIN';

  const load = () => {
    if (!termId) return;
    setLoading(true);
    api.loans
      .byTerm(termId)
      .then(setLoans)
      .finally(() => setLoading(false));
  };

  useEffect(load, [termId]);

  const handle = async (fn: () => Promise<Loan>) => {
    setActionError(null);
    try {
      await fn();
      load();
    } catch (e) {
      if (e instanceof ApiRequestError) setActionError({ code: e.errorCode, message: e.message });
      else setActionError({ code: 'UNKNOWN', message: 'Something went wrong.' });
    }
  };

  if (termLoading || loading) return <p className="text-ledger-ink-soft">Loading loans…</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-ledger-ink-soft mb-1">This term's loans</p>
        <h2 className="font-display text-2xl font-semibold text-ledger-green-deep">All applications</h2>
      </div>

      {actionError && <FallbackNotice code={actionError.code} message={actionError.message} />}

      {loans.length === 0 ? (
        <p className="text-ledger-ink-soft text-sm border border-dashed border-ledger-line rounded p-4">
          No loans recorded for this term yet.
        </p>
      ) : (
        <div className="bg-ledger-card border border-ledger-line rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ledger-line text-left text-ledger-ink-soft uppercase text-xs tracking-wide">
                <th className="px-4 py-2 font-medium">Member</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium text-right">Repayable</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-b border-ledger-line last:border-0 align-top">
                  <td className="px-4 py-3">{loan.memberName}</td>
                  <td className="px-4 py-3 text-right">
                    <Rupee value={loan.amount} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Rupee value={loan.totalRepayable} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusStamp status={loan.status} />
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && loan.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handle(() => api.loans.approve(loan.id, currentMember!.id))}
                          className="text-xs px-3 py-1 rounded-sm bg-ledger-green text-ledger-card hover:bg-ledger-green-deep"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handle(() => api.loans.reject(loan.id, currentMember!.id, 'Declined by admin'))
                          }
                          className="text-xs px-3 py-1 rounded-sm border border-ledger-rust text-ledger-rust hover:bg-ledger-rust hover:text-ledger-card"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {loan.status === 'APPROVED' && loan.memberId === currentMember?.id && (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={repayAmount[loan.id] ?? ''}
                          onChange={(e) => setRepayAmount((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                          className="w-24 border border-ledger-line rounded px-2 py-1 text-xs font-mono bg-ledger-bg"
                        />
                        <button
                          onClick={() =>
                            handle(() => api.loans.repay(loan.id, Number(repayAmount[loan.id] ?? 0)))
                          }
                          className="text-xs px-3 py-1 rounded-sm bg-ledger-gold text-ledger-card hover:opacity-90"
                        >
                          Record repayment
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
