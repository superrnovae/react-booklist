/**
 * Contexte d'authentification (§ Lot 4.1). Branche l'intercepteur unique
 * (injection du jeton + rafraîchissement single-flight), gère la session
 * persistée, expose le rôle pour masquer les actions d'écriture au lecteur.
 */
import { ErreurAuth } from '@/domain/erreurs';
import type { Role, Utilisateur } from '@/domain/types';
import { useConfirmation } from '@/features/ui/Confirmation';
import { viderCachePersistant } from '@/features/query/persister';
import { accederFileSync } from '@/features/sync/SyncProvider';
import { connexion as apiConnexion, profil } from '@/services/api/auth';
import { definirFournisseurAuth } from '@/services/api/client';
import { useI18n } from '@/theme/formats';
import { useQueryClient } from '@tanstack/react-query';
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
  const qc = useQueryClient();
  const { t } = useI18n();
  const { demanderConfirmation } = useConfirmation();
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
        // Poste de caisse partagé (§ contexte du sujet) : le fonds en cache
        // et les mutations en attente d'un libraire ne doivent pas fuiter
        // vers la session du suivant (BL-09). Mais la règle numéro un du
        // sujet est qu'une saisie de libraire ne se perd jamais — donc on
        // tente d'abord de vider la file, et on ne purge sans confirmation
        // que ce qui a réellement pu être envoyé.
        const acces = accederFileSync();
        if (acces && acces.nombreEnAttente() > 0) {
          await acces.synchroniser().catch(() => {});
        }
        const enAttente = acces?.nombreEnAttente() ?? 0;
        if (enAttente > 0) {
          const continuer = await demanderConfirmation({
            titre: t('auth.deconnexionTitre'),
            message: t('auth.deconnexionMessage', { count: enAttente }),
            valider: t('actions.confirmer'),
            annuler: t('actions.annuler'),
            destructive: true,
          });
          if (!continuer) return; // reste connecté : rien n'est perdu
        }

        await fermerSession();
        await acces?.purger();
        qc.clear();
        await viderCachePersistant();
        setEtat({ statut: 'deconnecte', utilisateur: null, authRequise: true });
      },
    };
  }, [etat, qc, t, demanderConfirmation]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): ContexteAuth {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useAuth doit être utilisé dans FournisseurAuthentification.');
  return ctx;
}
