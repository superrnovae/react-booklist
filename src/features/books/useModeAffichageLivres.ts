import { ecrireJson, lireJson } from '@/services/stockage';
import { useCallback, useEffect, useState } from 'react';

export type ModeAffichageLivres = 'ligne' | 'grille';

const CLE_MODE_AFFICHAGE = 'booklist.modeAffichage';

function modeValide(valeur: unknown): valeur is ModeAffichageLivres {
  return valeur === 'ligne' || valeur === 'grille';
}

export function useModeAffichageLivres() {
  const [mode, setMode] = useState<ModeAffichageLivres>('ligne');

  useEffect(() => {
    lireJson<unknown>(CLE_MODE_AFFICHAGE).then((stocke) => {
      if (modeValide(stocke)) setMode(stocke);
    });
  }, []);

  const definirMode = useCallback((prochain: ModeAffichageLivres) => {
    setMode(prochain);
    void ecrireJson(CLE_MODE_AFFICHAGE, prochain);
  }, []);

  return { mode, definirMode };
}
