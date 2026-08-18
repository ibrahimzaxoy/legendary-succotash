import { useEffect, useState } from 'react';
import { fetchBranches, fetchRestaurant } from '../api/endpoints';
import type { Branch, Restaurant } from '../api/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; restaurant: Restaurant; branches: Branch[] };

export function useBranches(restaurantId: string): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    Promise.all([fetchRestaurant(restaurantId), fetchBranches(restaurantId)])
      .then(([restaurant, branches]) => setState({ status: 'ready', restaurant, branches }))
      .catch(() => setState({ status: 'error', message: 'Couldn’t load branches.' }));
  }, [restaurantId]);

  return state;
}
