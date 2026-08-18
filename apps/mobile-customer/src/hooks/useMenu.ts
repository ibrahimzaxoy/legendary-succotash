import { useEffect, useState } from 'react';
import { fetchCategories, fetchItems } from '../api/endpoints';
import type { MenuCategory, MenuItem } from '../api/types';

type MenuState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: MenuCategory[]; items: MenuItem[] };

export function useMenu(branchId: string, channel: 'pickup' | 'delivery'): MenuState {
  const [state, setState] = useState<MenuState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    Promise.all([fetchCategories(branchId), fetchItems(branchId, channel)])
      .then(([categories, items]) => {
        if (cancelled) return;
        setState({ status: 'ready', categories: categories.sort((a, b) => a.sortOrder - b.sortOrder), items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Couldn’t load the menu.' });
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, channel]);

  return state;
}
