export function formatMoney(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return `$${value.toFixed(2)}`;
}
