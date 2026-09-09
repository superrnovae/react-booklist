/**
 * Anti-rebond générique. Renvoie la valeur stabilisée après `delaiMs` sans
 * changement (§ Lot 2 : recherche avec anti-rebond de 300 ms).
 */
import { useEffect, useState } from 'react';

export function useDebounce<T>(valeur: T, delaiMs = 300): T {
  const [stabilisee, setStabilisee] = useState(valeur);

  useEffect(() => {
    const id = setTimeout(() => setStabilisee(valeur), delaiMs);
    return () => clearTimeout(id);
  }, [valeur, delaiMs]);

  return stabilisee;
}
