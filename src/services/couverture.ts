/**
 * Résolution d'une valeur du champ `couverture` en URL affichable (§ Lot 3).
 * Une seule fonction, dans services/ : jamais dans un composant.
 *
 * - `/covers/<id>.svg` ou `/media/<id>.png` → préfixés par l'URL de base ;
 * - URL absolue (`http(s)://…`) → laissée intacte ;
 * - `null` → repli sur la couverture générée déterministe `/covers/<id>.svg`.
 */
import { URL_BASE } from './config';

export function resoudreCouverture(couverture: string | null, livreId: string): string {
  if (couverture && /^https?:\/\//i.test(couverture)) return couverture;
  const chemin = couverture ?? `/covers/${livreId}.svg`;
  const relatif = chemin.startsWith('/') ? chemin : `/${chemin}`;
  return `${URL_BASE}${relatif}`;
}
