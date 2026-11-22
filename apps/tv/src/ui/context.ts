import { createContext, useContext } from 'react';
import { useStore } from '../tv/store';
import type { Tv } from '../tv/tv';
import type { TvState } from '../tv/types';

export const TvContext = createContext<Tv | null>(null);

export function useTv(): Tv {
  const tv = useContext(TvContext);
  if (!tv) throw new Error('Falta TvContext');
  return tv;
}

/** Lee una parte del estado de la TV. Devuelve valores estables (primitivos o referencias guardadas). */
export function useTvState<U>(selector: (s: TvState) => U): U {
  return useStore(useTv().store, selector);
}
