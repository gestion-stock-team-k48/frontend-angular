import { describe, expect, it } from 'vitest';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
} from './pagination';

describe('parametresDePage', () => {
  it('envoie toujours page et size explicitement', () => {
    const parametres = parametresDePage({ page: 2, taille: 50 });

    expect(parametres.get('page')).toBe('2');
    expect(parametres.get('size')).toBe('50');
    expect(parametres.has('sort')).toBe(false);
  });

  it('écrit le tri au format attendu par Spring', () => {
    const parametres = parametresDePage({
      page: 0,
      taille: 20,
      tri: { champ: 'code', sens: 'desc' },
    });

    expect(parametres.get('sort')).toBe('code,desc');
  });
});

describe('etatDePage', () => {
  const page: ReponsePage<string> = {
    content: ['a', 'b', 'c'],
    pageNumber: 1,
    pageSize: 3,
    totalElements: 7,
    totalPages: 3,
    isLast: false,
  };

  it('dérive ce que le backend ne renvoie pas', () => {
    const etat = etatDePage(page);

    // `isFirst` et `numberOfElements` n'existent pas dans la réponse : ils sont déduits.
    expect(etat.premiere).toBe(false);
    expect(etat.nombreElements).toBe(3);
    expect(etat.derniere).toBe(false);
  });

  it('reconnaît la première page', () => {
    expect(etatDePage({ ...page, pageNumber: 0 }).premiere).toBe(true);
  });

  it('reste lisible devant une réponse absente', () => {
    const etat = etatDePage(undefined);

    expect(etat.total).toBe(0);
    expect(etat.taille).toBe(TAILLE_PAGE_PAR_DEFAUT);
    expect(etat.derniere).toBe(true);
    expect(contenuDePage(undefined)).toEqual([]);
  });
});
