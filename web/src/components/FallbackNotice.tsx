export function FallbackNotice({ code, message }: { code: string; message: string }) {
  return (
    <div className="border-2 border-ledger-rust bg-ledger-card px-5 py-4 rounded-sm flex items-start gap-4">
      <span className="stamp text-ledger-rust shrink-0">Not eligible</span>
      <div>
        <p className="text-sm text-ledger-ink-soft uppercase tracking-wide mb-0.5">{code.replaceAll('_', ' ')}</p>
        <p className="text-ledger-ink">{message}</p>
      </div>
    </div>
  );
}
