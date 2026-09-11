/**
 * BL-10 : ErrorBoundary doit pouvoir envelopper tout l'arbre _layout.tsx,
 * PersistQueryClientProvider et FournisseurTheme compris — donc son rendu de
 * secours ne doit dépendre d'aucun fournisseur de thème. Rendu ici avec le
 * `render` brut de la librairie, sans FournisseurTheme (contrairement à
 * rendreAvecTheme utilisé par les autres tests de composants), pour le
 * prouver plutôt que le supposer.
 */
const mockConsigner = jest.fn();
jest.mock('@/services/journal', () => ({
  consigner: (...args: unknown[]) => mockConsigner(...args),
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';

function ComposantQuiExplose(): never {
  throw new Error('Panne simulée');
}

// React journalise l'erreur interceptée sur console.error ; on la tait pour
// ce test précis, elle est attendue.
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
afterAll(() => consoleErrorSpy.mockRestore());

describe('<ErrorBoundary /> (BL-10)', () => {
  beforeEach(() => mockConsigner.mockReset());

  it('consigne l’erreur interceptée via le service de journalisation (§ Lot 5)', async () => {
    await render(
      <ErrorBoundary>
        <ComposantQuiExplose />
      </ErrorBoundary>,
    );

    expect(mockConsigner).toHaveBeenCalledTimes(1);
    const [niveau, message, options] = mockConsigner.mock.calls[0];
    expect(niveau).toBe('erreur');
    expect(message).toBe('Erreur interceptée par ErrorBoundary');
    expect(options.erreur).toBeInstanceOf(Error);
    expect(options.erreur.message).toBe('Panne simulée');
    expect(options.contexte).toHaveProperty('pileComposants');
  });

  it('affiche un écran exploitable sans aucun fournisseur de thème', async () => {
    const { getByText, getByRole } = await render(
      <ErrorBoundary>
        <ComposantQuiExplose />
      </ErrorBoundary>,
    );

    expect(getByText(/erreur inattendue/i)).toBeTruthy();
    expect(getByText('Panne simulée')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  it('permet de réessayer', async () => {
    let exploser = true;
    function ComposantIntermittent() {
      if (exploser) throw new Error('Panne simulée');
      return null;
    }

    const { getByRole, queryByText } = await render(
      <ErrorBoundary>
        <ComposantIntermittent />
      </ErrorBoundary>,
    );

    expect(queryByText(/erreur inattendue/i)).toBeTruthy();
    exploser = false;
    fireEvent.press(getByRole('button'));
    await waitFor(() => expect(queryByText(/erreur inattendue/i)).toBeNull());
  });

  it('rend ses enfants normalement en l’absence d’erreur', async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <Text>Contenu normal</Text>
      </ErrorBoundary>,
    );
    expect(getByText('Contenu normal')).toBeTruthy();
  });
});
