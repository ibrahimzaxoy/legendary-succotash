export function formatMoney(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return `$${value.toFixed(2)}`;
}

export function computeItemUnitPrice(
  basePrice: string,
  variantPriceDelta: string | undefined,
  modifierPriceDeltas: string[],
): number {
  const base = Number(basePrice) + Number(variantPriceDelta ?? 0);
  return modifierPriceDeltas.reduce((sum, delta) => sum + Number(delta), base);
}
