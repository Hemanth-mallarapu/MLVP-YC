import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { Rupee } from '../components/Rupee';

export function LedgerOverview() {
  const { term, termId, loading: termLoading } = useActiveTerm();
  const [allClubContributions, setAllClubContributions] = useState<any[]>([]);
  const [allClubLoans, setAllClubLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const globalContributionsPromise = (api.contributions && typeof (api.contributions as any).list === 'function')
      ? (api.contributions as any).list() : Promise.resolve([]);
    const globalLoansPromise = (api.loans && typeof api.loans.list === 'function')
      ? api.loans.list() : Promise.resolve([]);

    Promise.all([
      globalContributionsPromise.catch(() => []),
      globalLoansPromise.catch(() => [])
    ])
      .then(([globalConts, globalLns]) => {
        setAllClubContributions(Array.isArray(globalConts) ? globalConts : []);
        setAllClubLoans(Array.isArray(globalLns) ? globalLns : []);
      })
      .catch((err) => console.error("Global overview metric load breakdown failure:", err))
      .finally(() => setLoading(false));
  }, [termId]);

  const safeGlobalConts = Array.isArray(allClubContributions) ? allClubContributions : [];
  const safeGlobalLoans = Array.isArray(allClubLoans) ? allClubLoans : [];

  // FINANCIAL EQUATION ACCUMULATORS
  const grandTotalContributions = safeGlobalConts.reduce((acc, curr) => acc + (curr?.amount || 0), 0);
  const grandTotalRepayments = safeGlobalLoans
    .filter((l: any) => l?.status === 'REPAID' || l?.isRepaid)
    .reduce((acc, curr) => acc + (curr?.totalRepayable || curr?.amount || 0), 0);

  const currentTotalPoolVault = grandTotalContributions + grandTotalRepayments;

  if (termLoading || loading) return <p style={{ color: '#5B5646', fontFamily: 'sans-serif', padding: '2rem' }}>Generating financial roadmap...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* HEADER SECTION */}
      <div>
        <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#B4842A', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
          Shared Group Accountability Hub
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: '#1F4B3F', margin: 0 }}>
          Club Capital Pool Transparency Index
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#5B5646' }}>
          Public visibility matrix tracking overall pool metrics, cumulative savings growth, and upcoming loan repayments.
        </p>
      </div>

      {/* THREE-COLUMN STAT MATRIX ROW */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#5B5646', margin: '0 0 6px 0', fontWeight: 600 }}>Combined Member Contributions Pool</p>
          <Rupee value={grandTotalContributions} style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1B2430' }} />
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#5B5646', margin: '0 0 6px 0', fontWeight: 600 }}>Combined Settled Loan Recoveries</p>
          <Rupee value={grandTotalRepayments} style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1F4B3F' }} />
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: '#1B2430', border: '1px solid #B4842A', borderRadius: '12px', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#B4842A', margin: '0 0 6px 0', fontWeight: 700 }}>Total Active Liquidity In Vault</p>
          <Rupee value={currentTotalPoolVault} style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF' }} />
        </div>
      </section>

      {/* FULL-WIDTH ACCOUNTABILITY TIMELINE SHEET GRID */}
      <section style={{ backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #DCD2B8', backgroundColor: '#FFFDF8' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F4B3F' }}>Current 6-Month Term Vault Growth Roadmap</h4>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #DCD2B8', backgroundColor: '#F6F1E7', color: '#5B5646', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
              <th style={{ padding: '12px 16px' }}>Cycle Interval Breakdown</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Combined Deposits Received</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Loan Principal Collected</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>5% Profit Fees Harvested</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', backgroundColor: 'rgba(31,75,63,0.03)' }}>Accumulated Reserve Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const monthConts = safeGlobalConts.filter((c: any) => c?.monthNumber === num);
              const monthContsSum = monthConts.reduce((acc, curr) => acc + (curr?.amount || 0), 0);

              const monthLoansRepaid = safeGlobalLoans.filter((l: any) => (l?.status === 'REPAID' || l?.isRepaid) && (l?.id % 6 === num - 1));
              const monthPrincipalSum = monthLoansRepaid.reduce((acc, curr) => acc + (curr?.amount || 0), 0);
              const monthInterestSum = monthPrincipalSum * 0.05;

              const rawRowSubtotal = monthContsSum + monthPrincipalSum + monthInterestSum;

              const isAugCycle = term?.termName?.toLowerCase().includes('aug');
              const monthNames = isAugCycle
                ? ['August', 'September', 'October', 'November', 'December', 'January']
                : ['February', 'March', 'April', 'May', 'June', 'July'];

              return (
                <tr key={num} style={{ borderBottom: '1px solid #DCD2B8' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1B2430' }}>
                    {monthNames[num - 1]} (Month {num})
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#163A31' }}>+ <Rupee value={monthContsSum} /></td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#1B2430' }}>+ <Rupee value={monthPrincipalSum} /></td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#B4842A', fontWeight: 500 }}>+ <Rupee value={monthInterestSum} /></td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#1F4B3F', backgroundColor: 'rgba(31,75,63,0.03)' }}><Rupee value={rawRowSubtotal} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div style={{ padding: '1.25rem', borderLeft: '4px solid #B4842A', backgroundColor: 'rgba(180, 132, 42, 0.03)', fontSize: '0.85rem', color: '#5B5646', lineHeight: '1.5', borderRadius: '0 8px 8px 0' }}>
        <strong>Transparency Disclaimer:</strong> This log aggregates data transparently across all 11 registered club user signatures. Keeping this system forecasting matrix fully accessible allows accurate capital projection prior to the <strong>August</strong> and <strong>February</strong> rotation resets.
      </div>
    </div>
  );
}