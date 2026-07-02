import { useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import { useSession } from '../context/SessionContext';
import { FallbackNotice } from '../components/FallbackNotice';

export function Members() {
  const { members, refreshMembers, currentMember } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const isAdmin = currentMember?.role === 'ADMIN';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.members.create({ name, phone });
      setName('');
      setPhone('');
      await refreshMembers();
    } catch (e) {
      if (e instanceof ApiRequestError) setError({ code: e.errorCode, message: e.message });
      else setError({ code: 'UNKNOWN', message: 'Could not add member.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-ledger-ink-soft mb-1">The club</p>
        <h2 className="font-display text-2xl font-semibold text-ledger-green-deep">Members</h2>
      </div>

      <div className="bg-ledger-card border border-ledger-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ledger-line text-left text-ledger-ink-soft uppercase text-xs tracking-wide">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-ledger-line last:border-0">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2 text-ledger-ink-soft">{m.phone}</td>
                <td className="px-4 py-2 text-ledger-ink-soft">{m.joinDate}</td>
                <td className="px-4 py-2 text-ledger-ink-soft">{m.status}</td>
                <td className="px-4 py-2 text-ledger-ink-soft">{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div>
          <h3 className="font-display text-lg font-semibold text-ledger-green-deep mb-3">Add a member</h3>
          <form onSubmit={submit} className="bg-ledger-card border border-ledger-line rounded-sm p-6 space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-ledger-ink-soft mb-1">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-ledger-line rounded px-3 py-2 bg-ledger-bg"
              />
            </div>
            <div>
              <label className="block text-sm text-ledger-ink-soft mb-1">Phone</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-ledger-line rounded px-3 py-2 bg-ledger-bg font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-ledger-green text-ledger-card px-5 py-2 rounded-sm font-medium hover:bg-ledger-green-deep disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add member'}
            </button>
          </form>
          {error && <div className="mt-4"><FallbackNotice code={error.code} message={error.message} /></div>}
        </div>
      )}
    </div>
  );
}
