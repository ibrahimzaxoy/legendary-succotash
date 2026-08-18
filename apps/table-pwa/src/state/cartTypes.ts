import type { MenuItem, MenuItemVariant, ModifierOption } from '../api/types';

export interface CartLine {
  lineId: string;
  menuItem: MenuItem;
  variant: MenuItemVariant | null;
  modifiers: ModifierOption[];
  quantity: number;
  notes: string;
  unitPrice: number;
}
