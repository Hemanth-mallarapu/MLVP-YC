export function Rupee({ value, className = '' }: { value: number; className?: string }) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
  return <span className={`amount ${className}`}>{formatted}</span>;
}
