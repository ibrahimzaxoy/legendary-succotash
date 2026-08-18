import { useEffect, useState } from 'react';
import { fetchCategories, fetchDineInItems } from '../api/endpoints';
import type { MenuCategory, MenuItem } from '../api/types';

type MenuState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: MenuCategory[]; items: MenuItem[] };

export function useMenu(branchId: string): MenuState {
  const [state, setState] = useState<MenuState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    Promise.all([fetchCategories(branchId), fetchDineInItems(branchId)])
      .then(([categories, items]) => {
        if (cancelled) return;
        setState({ status: 'ready', categories: categories.sort((a, b) => a.sortOrder - b.sortOrder), items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Couldn’t load the menu. Pull down to try again.' });
      });

    return () => {
      cancelled = true;
    };
  }, [branchId]);

  return state;
}
