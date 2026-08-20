import { ECRAN_PAR_DEFAUT } from '../../core/auth/guards';

/**
 * Écran affiché quand aucune destination n'a été demandée, ou qu'elle a été écartée.
 *
 * Le tableau de bord, jamais la vitrine : on ne se connecte pas pour revenir à la page de
 * présentation du produit.
 */
const DESTINATION_PAR_DEFAUT = ECRAN_PAR_DEFAUT;

/**
 * Filtre la destination portée par `returnUrl`.
 *
 * Ce paramètre vient de l'URL, donc de l'extérieur : n'y sont acceptés que les chemins
 * internes. Une valeur absolue (`https://…`) ou protocole-relative (`//…`) renverrait
 * l'utilisateur vers un site tiers juste après qu'il ait saisi son mot de passe.
 */
export function destinationSure(demandee: string | null): string {
  if (demandee === null || !demandee.startsWith('/') || demandee.startsWith('//')) {
    return DESTINATION_PAR_DEFAUT;
  }
  // La vitrine n'est pas une destination : elle renverrait aussitôt au tableau de bord.
  return demandee === '/' ? DESTINATION_PAR_DEFAUT : demandee;
}
