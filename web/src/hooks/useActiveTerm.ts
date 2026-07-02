import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '../api/client';
import type { Term } from '../types';

export function useActiveTerm() {
  const [term, setTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.terms
      .getActive()
      .then(setTerm)
      .catch((e) => {
        if (e instanceof ApiRequestError) setError(e.message);
        else setError('Could not load the active term.');
      })
      .finally(() => setLoading(false));
  }, []);

  return { term, termId: term?.id ?? null, loading, error };
}
