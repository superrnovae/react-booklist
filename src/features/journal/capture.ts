/**
 * Branche la capture d'erreurs globales (services/erreursGlobales) sur le
 * service de journalisation (§ Lot 5). Fonction simple plutôt qu'un hook :
 * appelée une seule fois au démarrage (app/_layout.tsx), rien ici ne dépend
 * du cycle de rendu — ce qui la rend testable directement, sans rendu React.
 */
import { consigner } from '@/services/journal';
import { surErreurGlobale } from '@/services/erreursGlobales';

export function demarrerCaptureErreursGlobales(): () => void {
  return surErreurGlobale((erreur, fatale) => {
    consigner('erreur', fatale ? 'Erreur globale fatale, non interceptée' : 'Erreur globale non interceptée', {
      erreur,
      contexte: { fatale },
    });
  });
}
