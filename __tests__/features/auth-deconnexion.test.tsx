/**
 * BL-09 : sur un poste de caisse partagé, la déconnexion ne doit ni laisser
 * fuiter la file de mutations et le cache d'un libraire vers la session
 * suivante, ni perdre une saisie qui n'a pas encore pu être synchronisée
 * (règle numéro un du sujet) — d'où la tentative de synchronisation puis la
 * confirmation avant toute perte.
 */
jest.mock('@/services/api/auth', () => ({
  connexion: jest.fn(),
  profil: jest.fn(),
}));
jest.mock('@/features/auth/session', () => ({
  definirSurExpiration: jest.fn(),
  fermerSession: jest.fn(async () => {}),
  jetonAcces: jest.fn(() => null),
  ouvrirSession: jest.fn(async () => {}),
  rafraichir: jest.fn(async () => false),
  restaurerAcces: jest.fn(async () => null),
}));
jest.mock('@/features/sync/SyncProvider', () => ({
  accederFileSync: jest.fn(),
}));
jest.mock('@/features/query/persister', () => ({
  viderCachePersistant: jest.fn(async () => {}),
}));
const mockDemanderConfirmation = jest.fn();
jest.mock('@/features/ui/Confirmation', () => ({
  useConfirmation: () => ({ demanderConfirmation: mockDemanderConfirmation }),
}));
// BL-17 : sur un poste partagé, un échec de purge ne doit ni laisser
// deconnexion() rejeter en silence (l'appelant l'invoque avec `void`, voir
// app/reglages.tsx), ni laisser l'écran affiché comme « connecté ».
const mockAfficher = jest.fn();
jest.mock('@/features/ui/Snackbar', () => ({
  useSnackbar: () => ({ afficher: mockAfficher }),
  FournisseurSnackbar: ({ children }: { children: React.ReactNode }) => children,
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { FournisseurAuthentification, useAuth } from '@/features/auth/AuthProvider';
import { viderCachePersistant } from '@/features/query/persister';
import { accederFileSync } from '@/features/sync/SyncProvider';
import { profil } from '@/services/api/auth';
import { creerClientTest, EnveloppeQuery } from '../utils/rendu';

const profilMock = profil as jest.MockedFunction<typeof profil>;
const accederFileSyncMock = accederFileSync as jest.MockedFunction<typeof accederFileSync>;
const viderCachePersistantMock = viderCachePersistant as jest.MockedFunction<typeof viderCachePersistant>;

function wrapper() {
  const client = creerClientTest();
  return ({ children }: { children: ReactNode }) => (
    <EnveloppeQuery client={client}>
      <FournisseurAuthentification>{children}</FournisseurAuthentification>
    </EnveloppeQuery>
  );
}

async function connecte() {
  profilMock.mockResolvedValue({
    id: 'u1',
    email: 'editeur@booklist.fr',
    role: 'editeur',
    authRequise: true,
  });
  const { result } = await renderHook(() => useAuth(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.statut).toBe('connecte'));
  return result;
}

beforeEach(() => {
  profilMock.mockReset();
  accederFileSyncMock.mockReset();
  viderCachePersistantMock.mockReset();
  mockDemanderConfirmation.mockReset();
  mockAfficher.mockReset();
});

describe('FournisseurAuthentification — déconnexion (BL-09)', () => {
  it('purge la file et le cache quand tout a pu être synchronisé', async () => {
    const purger = jest.fn(async () => {});
    accederFileSyncMock.mockReturnValue({
      nombreEnAttente: () => 0,
      synchroniser: jest.fn(async () => {}),
      purger,
    });

    const result = await connecte();
    await act(async () => {
      await result.current.deconnexion();
    });

    expect(result.current.statut).toBe('deconnecte');
    expect(purger).toHaveBeenCalledTimes(1);
    expect(viderCachePersistantMock).toHaveBeenCalledTimes(1);
    expect(mockDemanderConfirmation).not.toHaveBeenCalled();
  });

  it('demande confirmation si des mutations restent en attente, et reste connecté si annulé', async () => {
    const purger = jest.fn(async () => {});
    const synchroniser = jest.fn(async () => {}); // tentative sans succès : la file reste à 2
    accederFileSyncMock.mockReturnValue({
      nombreEnAttente: () => 2,
      synchroniser,
      purger,
    });
    mockDemanderConfirmation.mockResolvedValue(false);

    const result = await connecte();
    await act(async () => {
      await result.current.deconnexion();
    });

    expect(synchroniser).toHaveBeenCalledTimes(1);
    expect(mockDemanderConfirmation).toHaveBeenCalledTimes(1);
    expect(purger).not.toHaveBeenCalled();
    expect(viderCachePersistantMock).not.toHaveBeenCalled();
    // Rien n'est perdu : la session reste ouverte tant que ce n'est pas confirmé.
    expect(result.current.statut).toBe('connecte');
  });

  it('purge après confirmation explicite malgré des mutations non synchronisées', async () => {
    const purger = jest.fn(async () => {});
    accederFileSyncMock.mockReturnValue({
      nombreEnAttente: () => 1,
      synchroniser: jest.fn(async () => {}),
      purger,
    });
    mockDemanderConfirmation.mockResolvedValue(true);

    const result = await connecte();
    await act(async () => {
      await result.current.deconnexion();
    });

    expect(purger).toHaveBeenCalledTimes(1);
    expect(viderCachePersistantMock).toHaveBeenCalledTimes(1);
    expect(result.current.statut).toBe('deconnecte');
  });

  it("un échec de purge n'empêche pas la déconnexion visible et prévient le libraire (BL-17)", async () => {
    const purger = jest.fn(async () => {
      throw new Error('stockage indisponible');
    });
    accederFileSyncMock.mockReturnValue({
      nombreEnAttente: () => 0,
      synchroniser: jest.fn(async () => {}),
      purger,
    });

    const result = await connecte();

    // deconnexion() ne doit jamais rejeter : app/reglages.tsx l'invoque avec
    // `void`, une rejection non gérée laisserait l'écran affiché "connecté"
    // avec un jeton déjà effacé — un état incohérent sur un poste partagé.
    await act(async () => {
      await expect(result.current.deconnexion()).resolves.toBeUndefined();
    });

    expect(result.current.statut).toBe('deconnecte');
    expect(mockAfficher).toHaveBeenCalledTimes(1);
  });
});
