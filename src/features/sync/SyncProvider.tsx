/**
 * Orchestration de la synchronisation hors ligne (§ Lot 4.2 / 4.3).
 * Connectivité, file persistée, rejeu par lot via POST /sync, collecte des
 * conflits pour arbitrage. La logique de décision est pure (domain/sync).
 *
 * Les conflits ne sont **pas** un état séparé : une mutation en conflit reste
 * dans la file persistée, marquée `conflit` (voir domain/mutations.ts), et
 * n'est retirée qu'une fois arbitrée (`resoudreConflit`). Elle survit ainsi à
 * un rechargement complet de la page, et n'est plus renvoyée à /sync tant
 * qu'elle n'est pas résolue (BL-02).
 */
import type { Mutation } from '@/domain/mutations';
import { motifRejet, resoudreSync, type Conflit } from '@/domain/sync';
import { clesLivres } from '@/features/books/cles';
import { useSnackbar } from '@/features/ui/Snackbar';
import { synchroniser } from '@/services/api/sync';
import { lireEtatReseau, surChangementReseau } from '@/services/reseau';
import { useI18n } from '@/theme/formats';
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
import { chargerFile, sauverFile, enfilerPersistant } from './file';

type ContexteSync = {
  enLigne: boolean;
  file: Mutation[];
  conflits: Conflit[];
  enfiler: (mutation: Mutation) => Promise<void>;
  synchroniser: () => Promise<void>;
  resoudreConflit: (id: string) => void;
};

const Contexte = createContext<ContexteSync | null>(null);

/**
 * Accès à la file, injectable depuis l'extérieur de l'arbre React (même
 * schéma que définirFournisseurAuth dans services/api/client.ts) — utile à
 * la déconnexion (BL-09) : FournisseurAuthentification est un *ancêtre* de
 * FournisseurSync dans _layout.tsx, il ne peut donc pas appeler useSync().
 * Avant de purger, on tente une synchronisation : la règle du sujet est
 * qu'une saisie de libraire ne se perd jamais, y compris à la déconnexion.
 */
type AccesFileSync = { nombreEnAttente: () => number; synchroniser: () => Promise<void>; purger: () => Promise<void> };
let accesFileInjecte: AccesFileSync | null = null;
export function definirAccesFileSync(acces: AccesFileSync | null): void {
  accesFileInjecte = acces;
}
export function accederFileSync(): AccesFileSync | null {
  return accesFileInjecte;
}

export function FournisseurSync({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { afficher } = useSnackbar();
  const [enLigne, setEnLigne] = useState(true);
  const [file, setFile] = useState<Mutation[]>([]);
  const enCours = useRef(false);
  const fileRef = useRef<Mutation[]>([]);

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  const conflits = useMemo<Conflit[]>(
    () =>
      file
        .filter((m) => m.conflit !== undefined)
        .map((m) => ({
          mutation: m,
          serveur: m.conflit!.serveur,
          versionAttendue: m.conflit!.versionAttendue,
        })),
    [file],
  );

  const lancerSync = useCallback(async () => {
    if (enCours.current) return;
    // Une mutation déjà en conflit attend un arbitrage manuel : on ne la
    // renvoie pas à chaque tentative (le serveur la mémorise de toute façon,
    // mais autant ne pas la resoumettre en boucle).
    const aEnvoyer = fileRef.current.filter((m) => m.conflit === undefined);
    if (aEnvoyer.length === 0) return;
    enCours.current = true;
    try {
      const reponse = await synchroniser(aEnvoyer);
      const decisions = resoudreSync(aEnvoyer, reponse);
      const parId = new Map(decisions.map((d) => [d.id, d]));

      const restante: Mutation[] = [];
      for (const m of fileRef.current) {
        const decision = parId.get(m.id);
        if (!decision) {
          restante.push(m); // hors de ce lot (déjà en conflit, exclue plus haut)
          continue;
        }
        if (decision.sort === 'retirer') {
          // Rejet de validation définitif (422) : la mutation est perdue,
          // mais le libraire en est informé — jamais en silence (BL-03).
          const motif = motifRejet(decision);
          if (motif) afficher(t('messages.mutationRejetee', { motif }));
          continue;
        }
        if (decision.sort === 'conflit') {
          restante.push({
            ...m,
            conflit: { serveur: decision.conflit.serveur, versionAttendue: decision.conflit.versionAttendue },
          });
          continue;
        }
        restante.push(m); // 'garder' : erreur transitoire, retentée au prochain essai
      }

      await sauverFile(restante);
      setFile(restante);
      void qc.invalidateQueries({ queryKey: clesLivres.tout });
    } catch {
      // Réseau/serveur indisponible : on garde la file pour un prochain essai.
    } finally {
      enCours.current = false;
    }
  }, [qc, t, afficher]);

  // Chargement initial de la file + état réseau, puis abonnement aux
  // changements. Si l'app démarre déjà en ligne avec une file non vide (cas
  // navigateur : surChangementReseau n'émet que sur transition, jamais de
  // valeur initiale — contrairement à NetInfo côté natif), il faut
  // déclencher la synchronisation nous-mêmes ici (BL-08).
  useEffect(() => {
    let annule = false;
    void Promise.all([chargerFile(), lireEtatReseau()]).then(([f, ligne]) => {
      if (annule) return;
      setFile(f);
      fileRef.current = f;
      setEnLigne(ligne);
      if (ligne && f.length > 0) void lancerSync();
    });
    const desabonner = surChangementReseau((ligne) => {
      setEnLigne(ligne);
      if (ligne) void lancerSync();
    });
    return () => {
      annule = true;
      desabonner();
    };
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

  /** Conflit arbitré (l'écriture directe vers le serveur a déjà eu lieu) : on retire la mutation de la file persistée. */
  const resoudreConflit = useCallback((id: string) => {
    const restante = fileRef.current.filter((m) => m.id !== id);
    fileRef.current = restante;
    setFile(restante);
    void sauverFile(restante);
  }, []);

  /** Vide la file, persistée comprise — utilisé à la déconnexion (BL-09) une fois la synchronisation tentée. */
  const viderFile = useCallback(async () => {
    fileRef.current = [];
    setFile([]);
    await sauverFile([]);
  }, []);

  useEffect(() => {
    definirAccesFileSync({
      nombreEnAttente: () => fileRef.current.length,
      synchroniser: lancerSync,
      purger: viderFile,
    });
    return () => definirAccesFileSync(null);
  }, [lancerSync, viderFile]);

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
