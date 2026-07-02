import type { Loan } from '../types';

const STYLES: Record<Loan['status'], string> = {
  PENDING: 'text-ledger-gold',
  APPROVED: 'text-ledger-green',
  REJECTED: 'text-ledger-rust',
  REPAID: 'text-ledger-sage',
  DEFAULTED: 'text-ledger-rust',
};

export function StatusStamp({ status }: { status: Loan['status'] }) {
  return <span className={`stamp ${STYLES[status]}`}>{status}</span>;
}
