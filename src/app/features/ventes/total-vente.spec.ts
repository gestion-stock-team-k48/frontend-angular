import { describe, expect, it } from 'vitest';
import { totalVente } from './total-vente';

describe('totalVente', () => {
  it('additionne les lignes renvoyées par le serveur', () => {
    const total = totalVente({
      lignes: [
        { quantite: 2, prixUnitaire: 7155 },
        { quantite: 3, prixUnitaire: 2000 },
      ],
    });

    expect(total).toBe(20310);
  });

  it('vaut zéro sans ligne, et devant une vente absente', () => {
    expect(totalVente({ lignes: [] })).toBe(0);
    expect(totalVente(undefined)).toBe(0);
  });

  it('ignore ce que le backend n’a pas renseigné', () => {
    expect(totalVente({ lignes: [{ quantite: 2 }, { prixUnitaire: 500 }] })).toBe(0);
  });
});
