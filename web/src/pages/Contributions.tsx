import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSession } from '../context/SessionContext';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { Rupee } from '../components/Rupee';
import type { Contribution } from '../types';

export function Contributions() {
  const { currentMember } = useSession();
  const { term, termId, loading: termLoading } = useActiveTerm();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [allClubContributions, setAllClubContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const operationalYears = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];

  const load = () => {
    if (!currentMember) return;
    setLoading(true);

    const activeTermId = termId || term?.id || 1;

    const termContributionsPromise = api.contributions.byTerm(activeTermId, currentMember.id);
    const globalContributionsPromise = (api.contributions && typeof (api.contributions as any).list === 'function')
      ? (api.contributions as any).list() : Promise.resolve([]);

    Promise.all([
      termContributionsPromise.catch(() => []),
      globalContributionsPromise.catch(() => []),
    ])
      .then(([termData, globalConts]) => {
        setContributions(Array.isArray(termData) ? termData : []);
        setAllClubContributions(Array.isArray(globalConts) ? globalConts : []);
      })
      .catch((err) => console.error("Data pipeline load failure:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [termId, term?.id, currentMember?.id]);

  // COMBINE AND UNIFY BOTH DATASETS: Ensures no data gets dropped regardless of which endpoint succeeds
  const combinedEntries = (() => {
    const uniqueMap = new Map<string | number, any>();

    if (Array.isArray(allClubContributions)) {
      allClubContributions.forEach(c => { if (c && c.id) uniqueMap.set(c.id, c); });
    }
    if (Array.isArray(contributions)) {
      contributions.forEach(c => { if (c && c.id) uniqueMap.set(c.id, c); });
    }

    return Array.from(uniqueMap.values());
  })();

  // FIXED HISTORY LIST FILTERING logic targeting the active selected year dropdown exclusively
  const displayHistoryList = combinedEntries.filter((c: any) => {
    if (!c) return false;

    // Safety check matching the exact logged-in user context session
    const mId = c.memberId || c.member?.id;
    if (mId !== currentMember?.id) return false;

    // Parse the high precision timestamp string directly
    const targetTimestamp = c.paidDate || c.createdAt;
    if (!targetTimestamp) return false;

    const yr = new Date(targetTimestamp).getFullYear().toString();
    return yr === selectedYear;
  });

  const historicTotalSum = displayHistoryList.reduce((acc, curr) => acc + (curr?.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '-0.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '2px solid #DCD2B8', paddingBottom: '0.75rem' }}>
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.72rem', color: '#5B5646', fontWeight: 600, margin: '0 0 2px 0', letterSpacing: '0.05em' }}>
            Rotating Capital System
          </p>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2.1rem', color: '#1F4B3F', margin: 0 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1F4B3F', fontWeight: 600, margin: 0 }}>Deposited Log for {selectedYear}</h3>
          <span style={{ fontSize: '0.85rem', color: '#5B5646' }}>Year Sum: <strong>₹{historicTotalSum.toLocaleString()}.00</strong></span>
        </div>

        {/* FIXED POSITION SCROLLABLE WRAPPER BOX */}
        <div style={{
          backgroundColor: '#FFFDF8',
          border: '1px solid #DCD2B8',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left', tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#FFFDF8', boxShadow: '0 1px 0 #DCD2B8' }}>
                <tr style={{ color: '#5B5646', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                  <th style={{ padding: '14px 16px', width: '40%', backgroundColor: '#FFFDF8' }}>Payment Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '30%', backgroundColor: '#FFFDF8' }}>Value Deposited</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', width: '30%', backgroundColor: '#FFFDF8' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={{ padding: '20px 16px', color: '#5B5646', fontStyle: 'italic' }}>Loading entries...</td>
                    <td style={{ padding: '20px 16px', textAlign: 'center', color: '#5B5646', fontStyle: 'italic' }}>Fetching...</td>
                    <td style={{ padding: '20px 16px', textAlign: 'right', color: '#5B5646', fontStyle: 'italic' }}>Syncing...</td>
                  </tr>
                ) : displayHistoryList.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '3.5rem', color: '#5B5646', textAlign: 'center', backgroundColor: '#FFFDF8' }}>
                      No monthly pool savings entries discovered for this timeline window.
                    </td>
                  </tr>
                ) : (
                  displayHistoryList.map((c) => {
                    if (!c) return null;

                    const rawTimestamp = c.paidDate || c.createdAt || new Date().toISOString();
                    const paymentDate = new Date(rawTimestamp);

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #DCD2B8' }}>
                        <td style={{ padding: '14px 16px', color: '#1B2430', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {paymentDate.toLocaleString('default', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#163A31' }}>
                          <Rupee value={c.amount || 0} />
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                            {c.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}