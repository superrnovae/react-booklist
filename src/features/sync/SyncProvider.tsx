/**
 * Orchestration de la synchronisation hors ligne (§ Lot 4.2 / 4.3).
 * Connectivité, file persistée, rejeu par lot via POST /sync, collecte des
 * conflits pour arbitrage. La logique de décision est pure (domain/sync).
 */
import type { Mutation } from '@/domain/mutations';
import { resoudreSync, type Conflit } from '@/domain/sync';
import { clesLivres } from '@/features/books/cles';
import { synchroniser } from '@/services/api/sync';
import { lireEtatReseau, surChangementReseau } from '@/services/reseau';
import { useQueryClient } from '@tanstack/react-query';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { chargerFile, enfilerPersistant, sauverFile } from './file';

type ContexteSync = {
  enLigne: boolean;
  file: Mutation[];
  conflits: Conflit[];
  enfiler: (mutation: Mutation) => Promise<void>;
  synchroniser: () => Promise<void>;
  resoudreConflit: (id: string) => void;
};

const Contexte = createContext<ContexteSync | null>(null);

export function FournisseurSync({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [enLigne, setEnLigne] = useState(true);
  const [file, setFile] = useState<Mutation[]>([]);
  const [conflits, setConflits] = useState<Conflit[]>([]);
  const enCours = useRef(false);
  const fileRef = useRef<Mutation[]>([]);

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  const lancerSync = useCallback(async () => {
    if (enCours.current) return;
    const courante = fileRef.current;
    if (courante.length === 0) return;
    enCours.current = true;
    try {
      const reponse = await synchroniser(courante);
      const decisions = resoudreSync(courante, reponse);
      const aRetirer = new Set(
        decisions.filter((d) => d.sort === 'retirer' || d.sort === 'conflit').map((d) => d.id),
      );
      const nouveauxConflits = decisions
        .filter((d): d is Extract<typeof d, { sort: 'conflit' }> => d.sort === 'conflit')
        .map((d) => d.conflit);

      const restante = courante.filter((m) => !aRetirer.has(m.id));
      await sauverFile(restante);
      setFile(restante);
      if (nouveauxConflits.length) setConflits((c) => [...c, ...nouveauxConflits]);
      void qc.invalidateQueries({ queryKey: clesLivres.tout });
    } catch {
      // Réseau/serveur indisponible : on garde la file pour un prochain essai.
    } finally {
      enCours.current = false;
    }
  }, [qc]);

  // Chargement initial de la file + état réseau, puis abonnement aux changements.
  useEffect(() => {
    void chargerFile().then((f) => {
      setFile(f);
      fileRef.current = f;
    });
    void lireEtatReseau().then(setEnLigne);
    const desabonner = surChangementReseau((ligne) => {
      setEnLigne(ligne);
      if (ligne) void lancerSync();
    });
    return desabonner;
  }, [lancerSync]);

  const enfiler = useCallback(
    async (mutation: Mutation) => {
      const fusion = await enfilerPersistant(fileRef.current, mutation);
      setFile(fusion);
      fileRef.current = fusion;
      if (enLigne) void lancerSync();
    },
    [enLigne, lancerSync],
  );

  const resoudreConflit = useCallback((id: string) => {
    setConflits((c) => c.filter((cf) => cf.mutation.id !== id));
  }, []);

  const valeur = useMemo<ContexteSync>(
    () => ({ enLigne, file, conflits, enfiler, synchroniser: lancerSync, resoudreConflit }),
    [enLigne, file, conflits, enfiler, lancerSync, resoudreConflit],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useSync(): ContexteSync {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useSync doit être utilisé dans FournisseurSync.');
  return ctx;
}
