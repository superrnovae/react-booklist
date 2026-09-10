/**
 * BL-04 : un conflit sur une mutation de suppression n'a pas de « valeur
 * locale » à comparer — l'écran ne doit jamais réécrire silencieusement la
 * version serveur sur elle-même en se faisant passer pour un succès.
 */
jest.mock('@/services/api/livres', () => ({
  supprimerLivre: jest.fn(),
  remplacerLivre: jest.fn(),
}));

const mockResoudreConflit = jest.fn();
jest.mock('@/features/sync/SyncProvider', () => ({
  useSync: () => ({ resoudreConflit: mockResoudreConflit }),
}));

import { fireEvent, waitFor } from '@testing-library/react-native';

import { CarteConflit } from '@/features/sync/ConflitCard';
import type { Conflit } from '@/domain/sync';
import type { Livre } from '@/domain/types';
import { FournisseurSnackbar } from '@/features/ui/Snackbar';
import { remplacerLivre, supprimerLivre } from '@/services/api/livres';
import { rendreAvecTheme, screen } from '../utils/rendu';

const supprimerLivreMock = supprimerLivre as jest.MockedFunction<typeof supprimerLivre>;
const remplacerLivreMock = remplacerLivre as jest.MockedFunction<typeof remplacerLivre>;

function livre(surcharge: Partial<Livre> = {}): Livre {
  return {
    id: 'l1',
    titre: 'Dune',
    auteur: 'Frank Herbert',
    editeur: 'Robert Laffont',
    annee: 1965,
    lu: false,
    favori: false,
    note: null,
    couverture: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    ...surcharge,
  };
}

const conflitSuppression: Conflit = {
  mutation: {
    id: 'm1',
    type: 'delete',
    horodatage: '2026-01-01T00:00:00.000Z',
    livreId: 'l1',
    baseVersion: 1,
  },
  serveur: livre({ version: 2, titre: 'Dune (édité côté serveur)' }),
  versionAttendue: 2,
};

function rendre() {
  return rendreAvecTheme(
    <FournisseurSnackbar>
      <CarteConflit conflit={conflitSuppression} />
    </FournisseurSnackbar>,
  );
}

beforeEach(() => {
  supprimerLivreMock.mockReset();
  remplacerLivreMock.mockReset();
  mockResoudreConflit.mockReset();
});

describe('CarteConflit — conflit sur une suppression (BL-04)', () => {
  it('« confirmer » appelle DELETE et ne ressuscite jamais l’ouvrage via un PUT', async () => {
    supprimerLivreMock.mockResolvedValue(undefined);
    await rendre();

    const [confirmer] = screen.getAllByRole('button');
    fireEvent.press(confirmer);

    await waitFor(() => expect(supprimerLivreMock).toHaveBeenCalledWith('l1'));
    expect(remplacerLivreMock).not.toHaveBeenCalled();
    expect(mockResoudreConflit).toHaveBeenCalledWith('m1');
  });

  it('« conserver la version serveur » n’émet aucun appel réseau', async () => {
    await rendre();

    const [, conserver] = screen.getAllByRole('button');
    fireEvent.press(conserver);

    expect(supprimerLivreMock).not.toHaveBeenCalled();
    expect(remplacerLivreMock).not.toHaveBeenCalled();
    expect(mockResoudreConflit).toHaveBeenCalledWith('m1');
  });
});
