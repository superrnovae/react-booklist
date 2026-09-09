/**
 * Contexte d'authentification (§ Lot 4.1). Branche l'intercepteur unique
 * (injection du jeton + rafraîchissement single-flight), gère la session
 * persistée, expose le rôle pour masquer les actions d'écriture au lecteur.
 */
import { ErreurAuth } from '@/domain/erreurs';
import type { Role, Utilisateur } from '@/domain/types';
import { connexion as apiConnexion, profil } from '@/services/api/auth';
import { definirFournisseurAuth } from '@/services/api/client';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    definirSurExpiration,
    fermerSession,
    jetonAcces,
    ouvrirSession,
    rafraichir,
    restaurerAcces,
} from './session';

type Statut = 'inconnu' | 'connecte' | 'deconnecte';

type Etat = { statut: Statut; utilisateur: Utilisateur | null; authRequise: boolean };

type ContexteAuth = Etat & {
  peutEcrire: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  deconnexion: () => Promise<void>;
};

const Contexte = createContext<ContexteAuth | null>(null);

export function FournisseurAuthentification({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Etat>({ statut: 'inconnu', utilisateur: null, authRequise: false });

  useEffect(() => {
    definirFournisseurAuth({ jetonAcces, rafraichir });
    definirSurExpiration(() =>
      setEtat({ statut: 'deconnecte', utilisateur: null, authRequise: true }),
    );

    void (async () => {
      await restaurerAcces();
      try {
        const p = await profil();
        setEtat({
          statut: 'connecte',
          utilisateur: { id: p.id, email: p.email, role: p.role as Role },
          authRequise: p.authRequise,
        });
      } catch (e) {
        setEtat({
          statut: 'deconnecte',
          utilisateur: null,
          authRequise: e instanceof ErreurAuth,
        });
      }
    })();

    return () => {
      definirFournisseurAuth(null);
      definirSurExpiration(null);
    };
  }, []);

  const valeur = useMemo<ContexteAuth>(() => {
    const peutEcrire = !etat.authRequise || etat.utilisateur?.role === 'editeur';
    return {
      ...etat,
      peutEcrire,
      connexion: async (email, motDePasse) => {
        const r = await apiConnexion(email, motDePasse);
        await ouvrirSession(r.accessToken, r.refreshToken);
        setEtat({ statut: 'connecte', utilisateur: r.utilisateur, authRequise: true });
      },
      deconnexion: async () => {
        await fermerSession();
        setEtat({ statut: 'deconnecte', utilisateur: null, authRequise: true });
      },
    };
  }, [etat]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): ContexteAuth {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useAuth doit être utilisé dans FournisseurAuthentification.');
  return ctx;
}
