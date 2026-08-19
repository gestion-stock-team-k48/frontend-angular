import { describe, expect, it } from 'vitest';
import { ligneVide, lignesValides, totalEstime } from './lignes';

const ARTICLES = [
  { id: 1, designation: 'Ciment', prixUnitaireTtc: 7155 },
  { id: 2, designation: 'Sable', prixUnitaireTtc: 2000 },
];

describe('lignes de saisie', () => {
  it('part d’une ligne vide, avec une quantité de 1', () => {
    expect(ligneVide()).toEqual({ articleId: '', quantite: 1 });
  });

  it('refuse une saisie sans ligne', () => {
    expect(lignesValides([])).toBe(false);
  });

  it('refuse une ligne sans article ou sans quantité', () => {
    expect(lignesValides([{ articleId: '', quantite: 2 }])).toBe(false);
    expect(lignesValides([{ articleId: '1', quantite: 0 }])).toBe(false);
  });

  it('accepte des lignes complètes', () => {
    expect(
      lignesValides([
        { articleId: '1', quantite: 2 },
        { articleId: '2', quantite: 5 },
      ]),
    ).toBe(true);
  });

  it('estime le total à partir des prix du catalogue', () => {
    const total = totalEstime(
      [
        { articleId: '1', quantite: 2 },
        { articleId: '2', quantite: 3 },
      ],
      ARTICLES,
    );

    expect(total).toBe(7155 * 2 + 2000 * 3);
  });

  it('compte pour zéro un article qui n’est pas dans la liste proposée', () => {
    expect(totalEstime([{ articleId: '99', quantite: 4 }], ARTICLES)).toBe(0);
  });
});
