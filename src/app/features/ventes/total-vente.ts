import type { Vente } from '../../core/api/api-types';

/**
 * Total d'une vente, calculé à partir de ses propres lignes.
 *
 * `VenteResponse` ne porte aucun total, contrairement aux commandes : le montant est dérivé
 * des lignes que le serveur a lui-même renvoyées, prix unitaires compris. Écart signalé
 * dans `docs/06-API-CONTRAT.md`.
 */
export function totalVente(vente: Vente | undefined): number {
  return (vente?.lignes ?? []).reduce(
    (total, ligne) => total + (ligne.prixUnitaire ?? 0) * (ligne.quantite ?? 0),
    0,
  );
}
