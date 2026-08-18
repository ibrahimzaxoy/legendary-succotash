import type { MenuItem, MenuItemVariant, ModifierOption, OrderItemInput } from '../api/types';

export interface CartLine {
  lineId: string;
  menuItem: MenuItem;
  variant: MenuItemVariant | null;
  modifiers: ModifierOption[];
  quantity: number;
  notes: string;
  unitPrice: number;
}

export function cartLinesToOrderItemInputs(lines: CartLine[]): OrderItemInput[] {
  return lines.map((l) => ({
    menuItemId: l.menuItem.id,
    menuItemVariantId: l.variant?.id,
    modifierOptionIds: l.modifiers.map((m) => m.id),
    quantity: l.quantity,
    notes: l.notes || undefined,
  }));
}
