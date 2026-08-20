import { describe, expect, it } from 'vitest';
import {
  SOURCES_PROPOSEES,
  ajouteAuStock,
  estSourceConnue,
  libelleSource,
  libelleType,
} from './libelles';

describe('libellés des mouvements', () => {
  it('parle la langue du métier, pas celle du code', () => {
    expect(libelleType('CORRECTION_POS')).toBe('Correction positive');
    expect(libelleSource('COMMANDE_FOURNISSEUR')).toBe('Commande fournisseur');
  });

  it('reste lisible quand le backend n’a rien renvoyé', () => {
    expect(libelleType(undefined)).toBe('—');
    expect(libelleSource(undefined)).toBe('—');
  });

  it('sait ce qui ajoute au stock et ce qui en retire', () => {
    expect(ajouteAuStock('ENTREE')).toBe(true);
    expect(ajouteAuStock('CORRECTION_POS')).toBe(true);
    expect(ajouteAuStock('SORTIE')).toBe(false);
    expect(ajouteAuStock('CORRECTION_NEG')).toBe(false);
  });

  it('propose les cinq sources déclarées par la spécification', () => {
    expect(SOURCES_PROPOSEES).toHaveLength(5);
  });

  it('refuse une source inconnue venue d’un contrôle de saisie', () => {
    expect(estSourceConnue('VENTE')).toBe(true);
    expect(estSourceConnue('')).toBe(false);
    expect(estSourceConnue('toString')).toBe(false);
  });
});
