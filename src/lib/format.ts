export function formatPKR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rs. 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rs. 0';
  return 'Rs. ' + num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

export function truncate(str: string | null | undefined, len: number = 30): string {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
