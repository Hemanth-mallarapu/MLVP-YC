import React, { useEffect, useState } from 'react';
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
  const [allClubContributions, setAllClubContributions] = useState<any[]>([]);
  const [allClubLoans, setAllClubLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const operationalYears = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];

  const load = () => {
    if (!currentMember) return;
    setLoading(true);

    const termContributionsPromise = termId ? api.contributions.byTerm(termId, currentMember.id) : Promise.resolve([]);
    const globalContributionsPromise = (api.contributions && typeof (api.contributions as any).list === 'function')
      ? (api.contributions as any).list() : Promise.resolve([]);
    const globalLoansPromise = (api.loans && typeof api.loans.list === 'function')
      ? api.loans.list() : Promise.resolve([]);

    Promise.all([
      termContributionsPromise.catch(() => []),
      globalContributionsPromise.catch(() => []),
      globalLoansPromise.catch(() => [])
    ])
      .then(([termData, globalConts, globalLns]) => {
        setContributions(Array.isArray(termData) ? termData : []);
        setAllClubContributions(Array.isArray(globalConts) ? globalConts : []);
        setAllClubLoans(Array.isArray(globalLns) ? globalLns : []);
      })
      .catch((err) => console.error("Data pipeline load failure:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [termId, currentMember?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;

    setError(null);
    setSuccessBanner('');

    // Current Date Parameters
    const now = new Date();
    const currentMonthText = now.toLocaleString('default', { month: 'long' });
    const currentYearNum = now.getFullYear();
    const currentMonthYearLabel = `${currentMonthText} ${currentYearNum}`;

    // Scan your visible ledger logs to see if a payment was already logged for this month/year
    const alreadyPaidThisMonth = displayHistoryList.some((c) => {
      if (!c) return false;
      const paymentDate = new Date(c.paidDate || c.createdAt || new Date());
      const formattedLogLabel = paymentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      return formattedLogLabel === currentMonthYearLabel;
    });

    if (alreadyPaidThisMonth) {
      // Calculate dynamic values for the next open payment window month & year
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthText = nextMonthDate.toLocaleString('default', { month: 'long' });
      const nextMonthYearNum = nextMonthDate.getFullYear();

      setError({
        code: 'DUPLICATE_PAYMENT',
        message: `${currentMonthText}/${currentYearNum} installment paid already. Next payment available on ${nextMonthText} 1st, ${nextMonthYearNum}. Status: Not eligible.`
      });
      return;
    }

    setSubmitting(true);

    const currentMonthIndex = now.getMonth();
    const calculatedTermMonth = (currentMonthIndex % 6) + 1;
    const amountValue = term?.monthlyContribution || 500;

    try {
      await api.contributions.add(termId || 1, {
        monthNumber: calculatedTermMonth,
        amount: amountValue,
        status: 'PAID',
        paidDate: new Date().toISOString().slice(0, 10),
        member: { id: currentMember.id },
        term: { id: termId || 1 },
      });

      load();

      const latestConts = (api.contributions && typeof (api.contributions as any).list === 'function')
        ? await (api.contributions as any).list().catch(() => []) : [];
      const personalHistory = Array.isArray(latestConts)
        ? latestConts.filter((c: any) => c?.memberId === currentMember.id || c?.member?.id === currentMember.id) : [];
      const runningAccumulatorTotal = personalHistory.reduce((acc: number, curr: any) => acc + (curr?.amount || 0), 0);

      setSuccessBanner(`For the ${currentMonthText}/${currentYearNum} MLVPYC contribution paid successfully! Current month updated, and your total contributions till this month stand at ₹${(runningAccumulatorTotal || amountValue).toLocaleString()}.00`);
    } catch (e) {
      if (e instanceof ApiRequestError) setError({ code: e.errorCode, message: e.message });
      else setError({ code: 'UNKNOWN', message: 'Could not pay installment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const safeGlobalConts = Array.isArray(allClubContributions) ? allClubContributions : [];
  const safeGlobalLoans = Array.isArray(allClubLoans) ? allClubLoans : [];

  const userFilteredHistory = safeGlobalConts.filter((c: any) => {
    if (!c || (c.memberId || c.member?.id) !== currentMember?.id) return false;
    const yr = new Date(c.paidDate || c.createdAt || new Date()).getFullYear().toString();
    return yr === selectedYear;
  });

  const displayHistoryList = userFilteredHistory.length > 0 ? userFilteredHistory : (Array.isArray(contributions) ? contributions : []);
  const historicTotalSum = displayHistoryList.reduce((acc, curr) => acc + (curr?.amount || 0), 0);

  const grandTotalContributions = safeGlobalConts.reduce((acc, curr) => acc + (curr?.amount || 0), 0);
  const grandTotalRepayments = safeGlobalLoans
    .filter((l: any) => l?.status === 'REPAID' || l?.isRepaid)
    .reduce((acc, curr) => acc + (curr?.totalRepayable || curr?.amount || 0), 0);

  const currentTotalPoolVault = grandTotalContributions + grandTotalRepayments;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '2px solid #DCD2B8', paddingBottom: '1rem' }}>
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#5B5646', fontWeight: 600, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
            Rotating Capital System
          </p>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#1F4B3F', margin: 0 }}>
            Your Contributions Ledger
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFDF8', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #DCD2B8' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5B5646' }}>Statement Filter:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', border: '1px solid #DCD2B8', borderRadius: '4px', outline: 'none', backgroundColor: '#FFFDF8', fontWeight: 600, color: '#1F4B3F', cursor: 'pointer' }}
          >
            {operationalYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>

      {/* CORE DISPLAY GRIDS */}
      <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: '2.5rem', alignItems: 'start' }}>

        {/* LEFT COLUMN: PERSONAL LIST */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1F4B3F', fontWeight: 600, margin: 0 }}>Deposited Log for {selectedYear}</h3>
            <span style={{ fontSize: '0.85rem', color: '#5B5646' }}>Year Sum: <strong>₹{historicTotalSum.toLocaleString()}.00</strong></span>
          </div>

          {loading ? (
            <p style={{ color: '#5B5646', fontSize: '0.9rem' }}>Querying transactions...</p>
          ) : displayHistoryList.length === 0 ? (
            <div style={{ backgroundColor: '#FFFDF8', border: '1px dashed #DCD2B8', padding: '2.5rem', borderRadius: '12px', color: '#5B5646', textAlign: 'center' }}>
              No monthly pool savings entries discovered for this timeline window.
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCD2B8', backgroundColor: '#FFFDF8', color: '#5B5646', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Payment Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Value Deposited</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayHistoryList.map((c) => {
                    if (!c) return null;
                    const paymentDate = new Date(c.paidDate || c.createdAt || new Date());
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #DCD2B8' }}>
                        <td style={{ padding: '14px 16px', color: '#1B2430', fontWeight: 500 }}>
                          {paymentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#163A31' }}>
                          <Rupee value={c.amount || 0} />
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                            {c.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PAYMENT DEPOSIT CARD */}
        <div style={{ flex: '1 1 320px', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', color: '#1F4B3F', fontWeight: 600 }}>
            Monthly Club Deposit
          </h3>

          {successBanner && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#16A34A', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {successBanner}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#F6F1E7', borderRadius: '8px', border: '1px solid #DCD2B8' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#5B5646', display: 'block', marginBottom: '4px' }}>Mandated Installment Value</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1F4B3F' }}><Rupee value={term?.monthlyContribution || 500} /></span>
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: '#5B5646', lineHeight: 1.45 }}>
              Clicking below logs your fixed asset deposit for the current calendar month directly into the shared lending reserve pool.
            </p>

            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', backgroundColor: '#1F4B3F', color: '#FFFDF8', border: 'none', padding: '0.9rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Authorizing Deposit...' : 'Pay Installment'}
            </button>
          </form>
          {error && <div style={{ marginTop: '1rem' }}><FallbackNotice code={error.code} message={error.message} /></div>}
        </div>
      </div>

      {/* SECTION 3: SHARED CLUB TRANSPARENCY MATRIX */}
      <section style={{ marginTop: '1rem', borderTop: '2px solid #DCD2B8', paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#B4842A', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
            Shared Group Accountability Hub
          </p>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', color: '#1F4B3F', margin: 0 }}>
            Club Capital Pool Transparency Index
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#5B5646' }}>
            Total visibility tracker. Displays everyone's combined monthly contributions and loan repayments so members can project upcoming August or February cycle availability.
          </p>
        </div>

        {/* METRICS SUMMARY ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px' }}>
            <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#5B5646', margin: '0 0 4px 0', fontWeight: 600 }}>Combined Member Contributions Pool</p>
            <Rupee value={grandTotalContributions} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1B2430' }} />
          </div>
          <div style={{ padding: '1.25rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px' }}>
            <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#5B5646', margin: '0 0 4px 0', fontWeight: 600 }}>Combined Settled Loan Recoveries (Principal+5%)</p>
            <Rupee value={grandTotalRepayments} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1F4B3F' }} />
          </div>
          <div style={{ padding: '1.25rem', backgroundColor: '#1B2430', border: '1px solid #B4842A', borderRadius: '8px', color: '#FFFFFF' }}>
            <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#B4842A', margin: '0 0 4px 0', fontWeight: 700 }}>Total Active Liquidity In Vault</p>
            <Rupee value={currentTotalPoolVault} style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }} />
          </div>
        </div>
      </section>

    </div>
  );
}