import { describe, expect, it } from 'vitest';
import { demandeDepuis, saisieDepuis } from './champs-tiers';

describe('saisieDepuis', () => {
  it('part de champs vides en création', () => {
    expect(saisieDepuis(undefined)).toEqual({
      nom: '',
      prenom: '',
      email: '',
      numTel: '',
      rue: '',
      ville: '',
      codePostal: '',
      pays: '',
    });
  });

  it('reprend les valeurs du tiers modifié', () => {
    const saisie = saisieDepuis({ nom: 'Ngono', prenom: 'Alice', email: 'alice@exemple.cm' });

    expect(saisie.nom).toBe('Ngono');
    expect(saisie.numTel).toBe('');
  });
});

describe('demandeDepuis', () => {
  const saisie = saisieDepuis(undefined);

  it('omet les champs facultatifs laissés vides', () => {
    const demande = demandeDepuis({
      ...saisie,
      nom: 'Ngono',
      prenom: 'Alice',
      email: 'alice@exemple.cm',
    });

    // Une adresse absente n'est pas une adresse vide : le champ ne part pas.
    expect(demande).toEqual({ nom: 'Ngono', prenom: 'Alice', email: 'alice@exemple.cm' });
  });

  it('conserve les champs facultatifs renseignés', () => {
    const demande = demandeDepuis({
      ...saisie,
      nom: 'Ngono',
      prenom: 'Alice',
      email: 'alice@exemple.cm',
      ville: 'Douala',
    });

    expect(demande.ville).toBe('Douala');
  });

  it('retire les espaces autour des valeurs', () => {
    const demande = demandeDepuis({
      ...saisie,
      nom: '  Ngono  ',
      prenom: 'Alice',
      email: ' alice@exemple.cm ',
      numTel: '   ',
    });

    expect(demande.nom).toBe('Ngono');
    expect(demande.email).toBe('alice@exemple.cm');
    // Un champ qui ne contient que des espaces est un champ vide.
    expect(demande.numTel).toBeUndefined();
  });
});
