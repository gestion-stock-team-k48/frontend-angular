import { describe, expect, it } from 'vitest';
import {
  actionVers,
  libelleEtat,
  modifiable,
  supprimable,
  tonEtat,
  transitionsLegales,
} from './etats-commande';

describe('états de commande', () => {
  it('ne propose que les transitions que le serveur accepte', () => {
    expect(transitionsLegales('EN_PREPARATION')).toEqual(['VALIDEE', 'ANNULEE']);
    expect(transitionsLegales('VALIDEE')).toEqual(['LIVREE', 'ANNULEE']);
    expect(transitionsLegales('LIVREE')).toEqual([]);
    expect(transitionsLegales('ANNULEE')).toEqual([]);
  });

  it('emploie le même verbe au bouton et au message', () => {
    // « Valider la commande » produit « Commande validée » : règle d'écriture du projet.
    expect(actionVers('VALIDEE')).toEqual({
      bouton: 'Valider la commande',
      succes: 'Commande validée',
    });
    expect(actionVers('LIVREE').succes).toBe('Commande livrée');
  });

  it('parle la langue du métier', () => {
    expect(libelleEtat('EN_PREPARATION')).toBe('En préparation');
    expect(libelleEtat(undefined)).toBe('—');
  });

  it('donne à chaque état son ton', () => {
    expect(tonEtat('LIVREE')).toBe('succes');
    expect(tonEtat('ANNULEE')).toBe('danger');
  });

  it('n’ouvre la modification qu’en préparation', () => {
    expect(modifiable('EN_PREPARATION')).toBe(true);
    expect(modifiable('VALIDEE')).toBe(false);
    expect(modifiable('LIVREE')).toBe(false);
  });

  it('interdit la suppression d’une commande livrée', () => {
    expect(supprimable('LIVREE')).toBe(false);
    expect(supprimable('ANNULEE')).toBe(true);
  });
});
