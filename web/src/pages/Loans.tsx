import React, { useEffect, useState } from 'react';
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
  const [allTimeLoans, setAllTimeLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<{ code: string; message: string } | null>(null);
  const [repayAmount, setRepayAmount] = useState<Record<number, string>>({});

  const isAdmin = currentMember?.role === 'ADMIN';

  const load = () => {
    setLoading(true);

    // Safely execute both promises using defensive fallback arrays if they reject or are missing
    const termLoansPromise = termId ? api.loans.byTerm(termId) : Promise.resolve([]);

    // Fallback gracefully if api.loans.list is completely missing from your old client setup
    const historyLoansPromise = (api.loans && typeof api.loans.list === 'function')
      ? api.loans.list()
      : Promise.resolve([]);

    Promise.all([
      termLoansPromise.catch(() => []),
      historyLoansPromise.catch(() => [])
    ])
      .then(([currentTermLoans, totalHistory]) => {
        setLoans(Array.isArray(currentTermLoans) ? currentTermLoans : []);
        setAllTimeLoans(Array.isArray(totalHistory) ? totalHistory : []);
      })
      .catch((err) => {
        console.error("Shielded credit metric pipeline load error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [termId]);

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

  // Aggressive protection array mapping guards
  const safeLoansList = Array.isArray(loans) ? loans : [];
  const safeHistoryList = Array.isArray(allTimeLoans) ? allTimeLoans : [];

  const myAllTimeLoans = safeHistoryList.filter(l => l && l.memberId === currentMember?.id);
  const totalPrincipalBorrowed = myAllTimeLoans.reduce((acc, curr) => acc + (curr?.amount || 0), 0);

  const totalInterestPaid = myAllTimeLoans
    .filter(l => l && (l.status === 'REPAID' || (l as any).isRepaid))
    .reduce((acc, curr) => acc + ((curr?.amount || 0) * 0.05), 0);

  const activeCycleLoan = safeLoansList.find(l => l && l.memberId === currentMember?.id && l.status === 'APPROVED');

  if (termLoading || loading) {
    return <p style={{ color: '#5B5646', fontFamily: 'sans-serif', padding: '2rem' }}>Loading club loan files…</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* HEADER BLOCK */}
      <div>
        <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#5B5646', fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
          Personal Credit Summary & Ledger
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#1F4B3F', margin: 0 }}>
          Loan Operations Tracker
        </h2>
      </div>

      {/* SUMMARY ACCUMULATOR ROW */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#5B5646', margin: '0 0 6px 0', fontWeight: 600 }}>Lifetime Principal Borrowed</p>
          <Rupee value={totalPrincipalBorrowed} style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1B2430' }} />
        </div>
        <div style={{ padding: '1.25rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#5B5646', margin: '0 0 6px 0', fontWeight: 600 }}>Total Interest Contributed (5% Rule)</p>
          <Rupee value={totalInterestPaid} style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1F4B3F' }} />
        </div>
        <div style={{ padding: '1.25rem', backgroundColor: '#1B2430', border: '1px solid #B4842A', borderRadius: '8px', color: '#FFFFFF' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#B4842A', margin: '0 0 6px 0', fontWeight: 700 }}>Active Unpaid Term Balance</p>
          <Rupee value={activeCycleLoan ? activeCycleLoan.amount : 0} style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF' }} />
        </div>
      </section>

      {/* ERROR NOTICE DISPLAY */}
      {actionError && <FallbackNotice code={actionError.code} message={actionError.message} />}

      {/* STATEMENT LEDGER TABLE */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', color: '#1F4B3F', margin: 0 }}>
          Active Term Applications Registry
        </h3>

        {safeLoansList.length === 0 ? (
          <div style={{ backgroundColor: '#FFFDF8', border: '1px dashed #DCD2B8', padding: '2rem', borderRadius: '8px', color: '#5B5646', textAlign: 'center' }}>
            No loan applications filed under this active rotation term cycle yet.
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #DCD2B8', backgroundColor: '#FFFDF8', color: '#5B5646', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Member Signature</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Principal Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Repayable</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Operational Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeLoansList.map((loan) => {
                  if (!loan) return null;
                  const isMe = loan.memberId === currentMember?.id;
                  return (
                    <tr
                      key={loan.id}
                      style={{
                        borderBottom: '1px solid #DCD2B8',
                        backgroundColor: isMe ? 'rgba(180, 132, 42, 0.03)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: '#1B2430', fontWeight: isMe ? 600 : 400 }}>
                        {loan.memberName} {isMe && <span style={{ fontSize: '0.75rem', color: '#6C4DE6', marginLeft: '4px', fontWeight: 600 }}>(You)</span>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>
                        <Rupee value={loan.amount || 0} />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#1F4B3F' }}>
                        <Rupee value={loan.totalRepayable || 0} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusStamp status={loan.status} />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>

                        {/* ADMIN GOVERNControls */}
                        {isAdmin && loan.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handle(() => api.loans.approve(loan.id, currentMember!.id))}
                              style={{ background: '#1F4B3F', color: '#FFFDF8', border: 'none', borderRadius: '4px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handle(() => api.loans.reject(loan.id, currentMember!.id, 'Declined by admin'))}
                              style={{ background: 'transparent', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '4px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* MEMBER REPAYMENT INTERACTIVE MODULE */}
                        {loan.status === 'APPROVED' && isMe && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={repayAmount[loan.id] ?? ''}
                              onChange={(e) => setRepayAmount((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                              style={{ width: '100px', padding: '0.35rem 0.5rem', border: '1px solid #DCD2B8', borderRadius: '4px', fontSize: '0.85rem', outline: 'none', backgroundColor: '#FFFDF8', textAlign: 'right' }}
                            />
                            <button
                              onClick={() => handle(() => api.loans.repay(loan.id, Number(repayAmount[loan.id] ?? 0)))}
                              style={{ background: '#B4842A', color: '#1B2430', border: 'none', borderRadius: '4px', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Record Repayment
                            </button>
                          </div>
                        )}

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}