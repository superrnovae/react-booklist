/**
 * BL-11 : pendant la résolution du profil (statut 'inconnu'), la garde de
 * routes ne doit plus rendre `null` (écran blanc) mais un squelette thémé —
 * exactement le premier instant de la démonstration de recette en mode
 * dégradé, où GET /me peut prendre plusieurs secondes.
 */
jest.mock('expo-router', () => ({
  Redirect: () => null,
  usePathname: jest.fn(() => '/'),
}));

const mockUseAuth = jest.fn();
jest.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ChargementInitial, Garde } from '@/features/auth/Garde';
import { rendreAvecTheme, screen } from '../utils/rendu';

describe('ChargementInitial (BL-11)', () => {
  it('affiche un squelette plutôt que rien', async () => {
    const { toJSON } = await rendreAvecTheme(<ChargementInitial />);
    // Pas de texte ni d'erreur : juste vérifier qu'un arbre réel est rendu,
    // pas `null` — c'est exactement la régression que ce test proscrit.
    expect(toJSON()).not.toBeNull();
  });
});

describe('Garde — statut « inconnu » (BL-11)', () => {
  beforeEach(() => mockUseAuth.mockReset());

  it('rend un squelette de chargement plutôt que rien pendant la résolution du profil', async () => {
    mockUseAuth.mockReturnValue({ statut: 'inconnu' });

    const { toJSON } = await rendreAvecTheme(
      <Garde>
        <Text>Contenu protégé</Text>
      </Garde>,
    );

    expect(toJSON()).not.toBeNull();
    expect(screen.queryByText('Contenu protégé')).toBeNull();
  });

  it('rend les enfants une fois connecté', async () => {
    mockUseAuth.mockReturnValue({ statut: 'connecte' });

    await rendreAvecTheme(
      <Garde>
        <Text>Contenu protégé</Text>
      </Garde>,
    );

    expect(screen.getByText('Contenu protégé')).toBeTruthy();
  });
});
