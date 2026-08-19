import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { messageDuChamp, repartirErreur } from './erreurs-formulaire';

interface Saisie {
  email: string;
  motDePasse: string;
}

function erreurValidation(champs: Record<string, string>): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    statusText: 'Bad Request',
    url: '/api/v1/auth/authenticate',
    error: {
      timestamp: '2026-08-19T11:00:43',
      status: 400,
      error: 'Bad Request',
      message: 'Un ou plusieurs champs sont invalides.',
      path: '/api/v1/auth/authenticate',
      validationErrors: champs,
    },
  });
}

describe('repartirErreur', () => {
  let formulaire: ReturnType<typeof creerFormulaire>;

  function creerFormulaire() {
    return form(signal<Saisie>({ email: '', motDePasse: '' }));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    formulaire = TestBed.runInInjectionContext(creerFormulaire);
  });

  it('pose chaque erreur de validation sous son champ, sans bandeau', () => {
    const echec = repartirErreur(erreurValidation({ email: "L'email est obligatoire" }), {
      email: formulaire.email,
    });

    expect(echec.message).toBeNull();
    expect(echec.erreurs).toHaveLength(1);
    expect(echec.erreurs[0]?.message).toBe("L'email est obligatoire");
    expect(echec.erreurs[0]?.fieldTree).toBe(formulaire.email);
  });

  it('remonte dans le bandeau ce qui ne correspond à aucun champ affiché', () => {
    const echec = repartirErreur(
      erreurValidation({ codeFiscal: 'Le code fiscal est obligatoire' }),
      {
        email: formulaire.email,
      },
    );

    expect(echec.message).toBe('Le code fiscal est obligatoire');
    expect(echec.erreurs).toHaveLength(0);
  });

  it('reprend le message du backend quand il ne détaille aucun champ', () => {
    const refus = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: {
        timestamp: '2026-08-19T11:00:43',
        status: 401,
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
        path: '/api/v1/auth/authenticate',
      },
    });

    const echec = repartirErreur(refus, { email: formulaire.email });

    expect(echec.message).toBe('Email ou mot de passe incorrect');
    expect(echec.erreurs).toHaveLength(0);
  });

  it('reste lisible devant une erreur qui ne vient pas de HTTP', () => {
    const echec = repartirErreur(new Error('boum'), { email: formulaire.email });

    expect(echec.message).toBe("La demande n'a pas pu être traitée. Réessayer.");
    expect(echec.erreurs).toHaveLength(0);
  });
});

describe('messageDuChamp', () => {
  it('rend le premier message porté par le champ', () => {
    expect(messageDuChamp([{ kind: 'required', message: 'Obligatoire' }])).toBe('Obligatoire');
  });

  it('rend null quand le champ est valide', () => {
    expect(messageDuChamp([])).toBeNull();
  });
});
