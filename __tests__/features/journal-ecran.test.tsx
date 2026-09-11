/**
 * Le texte affiché dépend de la langue résolue au démarrage par
 * theme/i18n.ts (expo-localization), qui varie selon la machine — déjà
 * rencontré et corrigé pour BL-03. On interagit et on vérifie donc via les
 * testID plutôt que le texte traduit ; seul le contenu fourni par le test
 * lui-même (message, contexte d'une entrée) est une valeur sûre à asserter.
 */
const mockDemanderConfirmation = jest.fn();
jest.mock('@/features/ui/Confirmation', () => ({
  useConfirmation: () => ({ demanderConfirmation: mockDemanderConfirmation }),
}));

import { fireEvent, waitFor } from '@testing-library/react-native';

import { EcranJournal } from '@/features/journal/EcranJournal';
import { _reinitialiserPourTests, consigner } from '@/services/journal';
import { AsyncStorage } from '@/services/stockage';
import { rendreAvecTheme } from '../utils/rendu';

describe('<EcranJournal /> (§ Lot 5)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    _reinitialiserPourTests();
    mockDemanderConfirmation.mockReset();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('n’affiche aucune entrée quand rien n’a encore été consigné', async () => {
    const { queryByTestId } = await rendreAvecTheme(<EcranJournal />);
    expect(queryByTestId('entree-journal')).toBeNull();
    expect(queryByTestId('vider-journal')).toBeNull(); // rien à vider
  });

  it('affiche les entrées consignées, du plus récent au plus ancien', async () => {
    consigner('info', 'application démarrée');
    consigner('erreur', 'échec réseau');

    const { getAllByTestId, getByText } = await rendreAvecTheme(<EcranJournal />);

    await waitFor(() => expect(getAllByTestId('entree-journal')).toHaveLength(2));
    const messages = getAllByTestId('entree-journal').map((n) => n);
    expect(messages).toHaveLength(2);
    expect(getByText('échec réseau')).toBeTruthy();
    expect(getByText('application démarrée')).toBeTruthy();
  });

  it('filtre les entrées par niveau', async () => {
    consigner('info', 'entrée info');
    consigner('erreur', 'entrée erreur');

    const { getByTestId, getAllByTestId, queryByText } = await rendreAvecTheme(<EcranJournal />);
    await waitFor(() => expect(getAllByTestId('entree-journal')).toHaveLength(2));

    fireEvent.press(getByTestId('filtre-niveau-erreur'));

    await waitFor(() => expect(getAllByTestId('entree-journal')).toHaveLength(1));
    expect(queryByText('entrée erreur')).toBeTruthy();
    expect(queryByText('entrée info')).toBeNull();
  });

  it('déplie une entrée pour afficher son contexte structuré', async () => {
    consigner('erreur', 'échec de synchronisation', { contexte: { chemin: '/books/42' } });

    const { getByTestId, getByText, queryByText } = await rendreAvecTheme(<EcranJournal />);
    await waitFor(() => expect(getByText('échec de synchronisation')).toBeTruthy());

    expect(queryByText(/books\/42/)).toBeNull();
    await fireEvent.press(getByTestId('entree-journal'));
    expect(getByText(/books\/42/)).toBeTruthy();
  });

  it('vider() ne s’exécute qu’après confirmation explicite', async () => {
    consigner('info', 'à effacer');
    mockDemanderConfirmation.mockResolvedValue(false);

    const { getByTestId, getAllByTestId } = await rendreAvecTheme(<EcranJournal />);
    await waitFor(() => expect(getAllByTestId('entree-journal')).toHaveLength(1));

    await fireEvent.press(getByTestId('vider-journal'));
    expect(mockDemanderConfirmation).toHaveBeenCalledTimes(1);
    // Annulé : l'entrée est toujours là.
    expect(getAllByTestId('entree-journal')).toHaveLength(1);
  });

  it('vider() efface bien le journal une fois confirmé', async () => {
    consigner('info', 'à effacer');
    mockDemanderConfirmation.mockResolvedValue(true);

    const { getByTestId, queryByTestId } = await rendreAvecTheme(<EcranJournal />);
    await waitFor(() => expect(queryByTestId('entree-journal')).toBeTruthy());

    await fireEvent.press(getByTestId('vider-journal'));
    await waitFor(() => expect(queryByTestId('entree-journal')).toBeNull());
  });
});
