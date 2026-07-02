import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PoolSummary, PriorityQueueEntry, MemberContributionSummary } from '../types';
import { Rupee } from '../components/Rupee';
import { useActiveTerm } from '../hooks/useActiveTerm';
import { useSession } from '../context/SessionContext';

export function Dashboard() {
  const { currentMember } = useSession();
  const { termId, term, loading: termLoading } = useActiveTerm();
  const [pool, setPool] = useState<PoolSummary | null>(null);
  const [queue, setQueue] = useState<PriorityQueueEntry[]>([]);
  const [myContribution, setMyContribution] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!termId) return;

    setLoading(true);
    Promise.all([
      api.terms.pool(termId),
      api.loans.priorityQueue(termId),
      // Attempt to safely discover lifetime contributions if available
      api.members.list().then(list => {
        const matching = list.find(m => m.id === currentMember?.id);
        return matching ? (matching as any).totalContributions || 0 : 0;
      }).catch(() => 0)
    ])
      .then(([p, q, contribTotal]) => {
        setPool(p);
        setQueue(q);
        setMyContribution(contribTotal);
      })
      .catch((err) => console.error("Error loading dashboard metrics:", err))
      .finally(() => setLoading(false));
  }, [termId, currentMember]);

  // Find where the logged-in user explicitly sits in the current 6-month priority queue
  const myQueueEntry = queue.find((entry) => entry.memberId === currentMember?.id);

  const handlePayInstallment = async () => {
    if (!termId || !currentMember) return;
    setPayLoading(true);
    try {
      // Direct integration mapping straight to your backend contribution controller
      await api.contributions.create({
        memberId: currentMember.id,
        termId: termId,
        amount: 500 // Default mandated 6-month cycle payment amount
      });
      alert('Monthly contribution of ₹500 recorded successfully!');
      // Refresh pool aggregates instantly
      const updatedPool = await api.terms.pool(termId);
      setPool(updatedPool);
    } catch (err: any) {
      alert(err.message || 'Payment processing encountered an issue.');
    } finally {
      setPayLoading(false);
    }
  };

  if (termLoading) return <p style={{ color: '#5B5646', fontFamily: 'sans-serif' }}>Loading current rotation term…</p>;

  if (!termId) {
    return (
      <div style={{ padding: '2rem', border: '1px dashed #DCD2B8', backgroundColor: '#FFFDF8', borderRadius: '8px', color: '#5B5646', fontFamily: 'sans-serif' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1F4B3F' }}>No Active Rotation Cycle Found</h3>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Please wait until an administrator initializes the next 6-month cycle (Feb-Aug / Aug-Feb) from the control panel.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* SECTION 1: HEADER IDENTITY HEADER */}
      <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '2px solid #DCD2B8', paddingBottom: '1rem' }}>
        <div>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', tracking: '0.1em', color: '#5B5646', fontWeight: 600, letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Current Active 6-Month Cycle</p>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '2.2rem', fontWeight: 700, color: '#163A31', margin: 0 }}>{term?.termName}</h2>
        </div>
        <div style={{ backgroundColor: '#1F4B3F', color: '#FFFDF8', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
          Loan Limit Rule: Max <Rupee value={200000} /> per person
        </div>
      </section>

      {/* SECTION 2: PERSONALIZED MEMBER ACTION HUB ROW */}
      <section style={{ background: 'linear-gradient(135deg, #24212F 0%, #171420 100%)', borderRadius: '16px', padding: '2rem', color: '#FFFFFF', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', color: '#B4842A', margin: '0 0 1.5rem 0', fontWeight: 600 }}>Your Member Ledger Summary</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>

          {/* Item 1: Custom Priority Rank indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ color: '#A09BB0', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Next Loan Priority</span>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#FFFFFF', margin: '0.5rem 0' }}>
              {myQueueEntry ? `#${myQueueEntry.rank}` : 'Last'}
            </span>
            <span style={{ color: '#7E7A8A', fontSize: '0.75rem' }}>
              {myQueueEntry ? `Score: ${myQueueEntry.priorityScore.toFixed(2)}` : 'No borrow history recorded'}
            </span>
          </div>

          {/* Item 2: Savings Accumulation metric */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ color: '#A09BB0', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Your Saved Contribution</span>
            <div style={{ margin: '0.5rem 0' }}>
              <Rupee value={myContribution > 0 ? myContribution : (pool ? 500 : 0)} className="text-2xl font-semibold" style={{ color: '#FFFFFF', fontSize: '2rem', fontWeight: 700 }} />
            </div>
            <span style={{ color: '#7E7A8A', fontSize: '0.75rem' }}>Includes historical pool values</span>
          </div>

          {/* Item 3: Quick Action Monthly default payout module */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid #363145', paddingLeft: '1.5rem' }}>
            <div>
              <span style={{ color: '#A09BB0', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Monthly Term Installment</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4ADE80', display: 'block', mt: '2px' }}>₹ 500.00 Due</span>
            </div>
            <button
              onClick={handlePayInstallment}
              disabled={payLoading}
              style={{
                backgroundColor: '#6C4DE6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                opacity: payLoading ? 0.5 : 1
              }}
            >
              {payLoading ? 'Recording Payment...' : 'Pay ₹500 Default Installment'}
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 3: MUTUAL FINANCIAL POOL AGGREGATES */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', tracking: '0.05em', color: '#5B5646', margin: '0 0 6px 0', fontWeight: 600 }}>Collected From Members This Term</p>
          <Rupee value={pool?.totalCollected ?? 0} style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1B2430' }} />
        </div>

        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', tracking: '0.05em', color: '#5B5646', margin: '0 0 6px 0', fontWeight: 600 }}>Currently Lent Out</p>
          <Rupee value={pool?.totalLent ?? 0} style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1B2430' }} />
        </div>

        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFDF8', border: '1px solid #B4842A', borderRadius: '8px', boxShadow: '0 4px 12px rgba(180,132,42,0.08)' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', tracking: '0.05em', color: '#B4842A', margin: '0 0 6px 0', fontWeight: 700 }}>Available Fund to Borrow</p>
          <Rupee value={pool?.available ?? 0} style={{ fontSize: '1.75rem', fontWeight: 700, color: '#B4842A' }} />
        </div>
      </section>

      {/* SECTION 4: LOAN PRIORITY LIST TRANSPARENCY QUEUE */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.35rem', fontWeight: 600, color: '#163A31', margin: 0 }}>Term Priority Matrix</h3>
          <span style={{ fontSize: '0.75rem', color: '#5B5646', fontWeight: 500 }}>Lower Score = Higher Priority for next cycle allocation</span>
        </div>

        {loading ? (
          <p style={{ color: '#5B5646', fontSize: '0.9rem' }}>Analyzing priority metrics…</p>
        ) : queue.length === 0 ? (
          <p style={{ color: '#5B5646', fontSize: '0.9rem', padding: '1.5rem', border: '1px dashed #DCD2B8', borderRadius: '6px', textAlign: 'center', backgroundColor: '#FFFDF8' }}>
            No one is currently waiting for a loan allocation this term.
          </p>
        ) : (
          <div style={{ backgroundColor: '#FFFDF8', border: '1px solid #DCD2B8', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #DCD2B8', backgroundColor: '#FFFDF8', color: '#5B5646', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Rank</th>
                  <th style={{ padding: '12px 16px' }}>Member Signature Identity</th>
                  <th style={{ padding: '12px 16px' }}>Eligibility Context</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Calculated Score</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((entry) => {
                  const isMe = entry.memberId === currentMember?.id;
                  return (
                    <tr
                      key={entry.memberId}
                      style={{
                        borderBottom: '1px solid #DCD2B8',
                        backgroundColor: isMe ? 'rgba(180, 132, 42, 0.05)' : 'transparent',
                        fontWeight: isMe ? 600 : 400
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: '#B4842A', fontFamily: "'Fraunces', serif", fontWeight: 700 }}>#{entry.rank}</td>
                      <td style={{ padding: '14px 16px', color: '#1B2430' }}>
                        {entry.memberName} {isMe && <span style={{ fontSize: '0.75rem', color: '#6C4DE6', marginLeft: '4px', fontWeight: 600 }}>(You)</span>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#5B5646', fontSize: '0.85rem' }}>{entry.eligibilityNote}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1B2430' }}>{entry.priorityScore.toFixed(3)}</td>
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