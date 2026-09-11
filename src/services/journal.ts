/**
 * Service de journalisation structurée (§ Lot 5). Point unique qui écrit
 * vers la console (au niveau adapté), persiste un journal borné, et notifie
 * ses abonnés (l'écran Journal de features/journal/). Au-dessus de cette
 * couche, plus aucun console.* direct pour signaler une erreur applicative :
 * on passe par consigner() — c'est ce qui rend la journalisation « structurée »
 * plutôt qu'une suite de console.log ad hoc.
 */
import type { EntreeJournal, NiveauJournal } from '@/domain/journal';
import { ajouterEntree, depuisErreur } from '@/domain/journal';
import { genererId } from './id';
import { ecrireJson, lireJson } from './stockage';

const CLE_JOURNAL = 'booklist.journal';

let journal: EntreeJournal[] = [];
let chargement: Promise<void> | null = null;
// Vrai dès le premier consigner()/viderJournal() de la session. Empêche la
// lecture de démarrage — asynchrone, lancée par le premier abonné — d'écraser
// des entrées déjà ajoutées entre-temps : le stockage ne représente que ce
// qui existait AVANT cette session, jamais ce qui s'est passé depuis. Sans
// cette garde, consigner() une erreur avant que le chargement initial n'ait
// eu le temps de résoudre la ferait disparaître dès qu'il résout.
let ecritDepuisDemarrage = false;
const abonnes = new Set<(journal: EntreeJournal[]) => void>();

function notifier(): void {
  for (const cb of abonnes) cb(journal);
}

function assurerChargement(): Promise<void> {
  if (!chargement) {
    chargement = lireJson<EntreeJournal[]>(CLE_JOURNAL).then((j) => {
      if (ecritDepuisDemarrage) return;
      journal = j ?? [];
      notifier();
    });
  }
  return chargement;
}

function consoleDuNiveau(niveau: NiveauJournal): (...args: unknown[]) => void {
  // Résolu à l'appel, pas mémorisé au chargement du module : un spy posé sur
  // console.error par un test (jest.spyOn) ne patche pas une référence déjà
  // capturée, seulement la propriété courante de l'objet console.
  if (niveau === 'erreur') return console.error;
  if (niveau === 'avertissement') return console.warn;
  return console.info;
}

/** Écrit une entrée structurée : console (niveau adapté) + mémoire + stockage persistant. */
export function consigner(
  niveau: NiveauJournal,
  message: string,
  options: { contexte?: Record<string, unknown>; erreur?: unknown } = {},
): void {
  const entree: EntreeJournal = {
    id: genererId(),
    horodatage: new Date().toISOString(),
    niveau,
    message,
    contexte: options.contexte,
    erreur: options.erreur !== undefined ? depuisErreur(options.erreur) : undefined,
  };

  consoleDuNiveau(niveau)(`[${entree.horodatage}] ${niveau.toUpperCase()} — ${message}`, options.contexte ?? '', options.erreur ?? '');

  ecritDepuisDemarrage = true;
  journal = ajouterEntree(journal, entree);
  notifier();
  void ecrireJson(CLE_JOURNAL, journal);
}

/** Journal courant, chargé depuis le stockage persistant si ce n'est pas déjà fait. */
export async function journalRecent(): Promise<EntreeJournal[]> {
  await assurerChargement();
  return journal;
}

export function viderJournal(): void {
  ecritDepuisDemarrage = true;
  journal = [];
  notifier();
  void ecrireJson(CLE_JOURNAL, []);
}

/** Abonnement réactif pour l'écran Journal. Retourne la fonction de désabonnement. */
export function surJournal(cb: (journal: EntreeJournal[]) => void): () => void {
  abonnes.add(cb);
  void assurerChargement().then(() => cb(journal));
  return () => {
    abonnes.delete(cb);
  };
}

/** Réinitialise l'état module (tests uniquement). */
export function _reinitialiserPourTests(): void {
  journal = [];
  chargement = null;
  ecritDepuisDemarrage = false;
  abonnes.clear();
}
