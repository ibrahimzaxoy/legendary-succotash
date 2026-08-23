// Mirrors a SharedCartItem, enriched with the adding guest's label and
// whether it's this phone's own item (controls whether qty/remove show).
export interface CartLine {
  lineId: string;
  guestId: string;
  guestLabel: string;
  isMine: boolean;
  nameSnapshot: string;
  unitPriceSnapshot: string;
  modifierNamesSnapshot: string[];
  quantity: number;
  notes: string;
}
