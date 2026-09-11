import {
    _reinitialiserPourTests,
    consigner,
    journalRecent,
    surJournal,
    viderJournal,
} from '@/services/journal';
import { AsyncStorage } from '@/services/stockage';

const CLE_JOURNAL = 'booklist.journal';

describe('journal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    _reinitialiserPourTests();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('consigner() ajoute une entrée consultable via journalRecent()', async () => {
    consigner('info', 'application démarrée');
    const journal = await journalRecent();
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({ niveau: 'info', message: 'application démarrée' });
    expect(journal[0].id).toEqual(expect.any(String));
    expect(journal[0].horodatage).toEqual(expect.any(String));
  });

  it('consigner() écrit vers console.error pour le niveau erreur, jamais console.log', () => {
    consigner('erreur', 'échec réseau');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('consigner() écrit vers console.warn pour le niveau avertissement', () => {
    consigner('avertissement', 'requête réessayée');
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('normalise une erreur JS passée en option vers la forme structurée', async () => {
    consigner('erreur', 'échec de synchronisation', { erreur: new TypeError('mauvaise réponse') });
    const [entree] = await journalRecent();
    expect(entree.erreur).toMatchObject({ nom: 'TypeError', message: 'mauvaise réponse' });
  });

  it('persiste chaque entrée : relue depuis le stockage par une session qui n\'a encore rien en mémoire', async () => {
    consigner('info', 'entrée persistée');
    // Laisse l'écriture asynchrone vers AsyncStorage se terminer.
    await new Promise((r) => setTimeout(r, 0));

    // Simule une nouvelle session (rechargement de page) : plus rien en
    // mémoire, mais le stockage, lui, a survécu.
    _reinitialiserPourTests();
    const journal = await journalRecent();
    expect(journal).toHaveLength(1);
    expect(journal[0].message).toBe('entrée persistée');
  });

  it('viderJournal() efface le journal en mémoire et le stockage', async () => {
    consigner('info', 'à effacer');
    viderJournal();
    expect(await journalRecent()).toHaveLength(0);
    expect(await AsyncStorage.getItem(CLE_JOURNAL)).toBe('[]');
  });

  it('surJournal() notifie les abonnés à chaque nouvelle entrée, plus après désabonnement', () => {
    const rappel = jest.fn();
    const desabonner = surJournal(rappel);

    consigner('info', 'un');
    consigner('info', 'deux');

    expect(rappel).toHaveBeenCalled();
    const dernierAppel = rappel.mock.calls[rappel.mock.calls.length - 1][0];
    expect(dernierAppel).toHaveLength(2);

    desabonner();
    consigner('info', 'trois');
    // Toujours 2 dans le dernier appel reçu avant désabonnement : aucun appel supplémentaire.
    expect(rappel.mock.calls[rappel.mock.calls.length - 1][0]).toHaveLength(2);
  });
});
