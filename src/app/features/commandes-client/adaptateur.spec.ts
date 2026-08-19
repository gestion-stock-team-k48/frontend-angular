import { describe, expect, it } from 'vitest';
import { versDemande, versVue } from './adaptateur';
import type { CommandeClient } from '../../core/api/api-types';

const REPONSE: CommandeClient = {
  id: 3,
  codeCommande: 'CC-2026-0003',
  dateCommande: '2026-08-19',
  etatCommande: 'VALIDEE',
  idClient: 7,
  clientNom: 'Ngono',
  clientPrenom: 'Alice',
  totalHt: 12000,
  totalTva: 2310,
  totalTtc: 14310,
  lignes: [{ id: 1, articleId: 4, articleDesignation: 'Ciment', quantite: 2 }],
};

describe('adaptateur des commandes client', () => {
  it('range le client dans la forme commune aux deux modules', () => {
    const vue = versVue(REPONSE);

    expect(vue.tiersId).toBe(7);
    expect(vue.tiersNom).toBe('Alice Ngono');
    expect(vue.code).toBe('CC-2026-0003');
    expect(vue.lignes).toHaveLength(1);
  });

  it('reste lisible quand le backend n’a rien renvoyé', () => {
    const vue = versVue({});

    expect(vue.tiersNom).toBe('');
    expect(vue.lignes).toEqual([]);
  });

  it('omet le code laissé vide pour que le serveur en attribue un', () => {
    const demande = versDemande({
      code: '   ',
      date: '2026-08-19',
      tiersId: '7',
      lignes: [{ articleId: '4', quantite: 2 }],
    });

    expect(demande.codeCommande).toBeUndefined();
    expect(demande.idClient).toBe(7);
    expect(demande.lignes).toEqual([{ articleId: 4, quantite: 2 }]);
  });

  it('conserve un code saisi', () => {
    const demande = versDemande({
      code: 'CC-2026-0003',
      date: '2026-08-19',
      tiersId: '7',
      lignes: [{ articleId: '4', quantite: 1 }],
    });

    expect(demande.codeCommande).toBe('CC-2026-0003');
  });
});
