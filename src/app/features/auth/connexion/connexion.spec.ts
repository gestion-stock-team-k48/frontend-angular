import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Connexion } from './connexion';
import { provideAppConfig } from '../../../core/config/app-config';

const BASE = '/api/v1';

async function monter() {
  await TestBed.configureTestingModule({
    imports: [Connexion],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Connexion);
  await fixture.whenStable();
  return fixture;
}

/** Saisit une valeur comme le ferait l'utilisateur, pour que le champ se sache modifié. */
function saisir(racine: HTMLElement, selecteur: string, valeur: string): void {
  const controle = racine.querySelector<HTMLInputElement>(selecteur);
  if (controle === null) {
    throw new Error(`Contrôle introuvable : ${selecteur}`);
  }
  controle.value = valeur;
  controle.dispatchEvent(new Event('input'));
}

function envoyer(racine: HTMLElement): void {
  racine.querySelector('form')?.dispatchEvent(new Event('submit'));
}

describe('Connexion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('envoie les identifiants saisis', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#connexion-email', 'jordan@exemple.cm');
    saisir(racine, '#connexion-mot-de-passe', 'secret');
    await fixture.whenStable();

    envoyer(racine);
    await fixture.whenStable();

    const http = TestBed.inject(HttpTestingController);
    const requete = http.expectOne(`${BASE}/auth/authenticate`);
    expect(requete.request.body).toEqual({
      email: 'jordan@exemple.cm',
      motDePasse: 'secret',
    });

    requete.flush({ token: 'jeton', refreshToken: 'refresh' });
    http.expectOne(`${BASE}/utilisateurs/me`).flush({ id: 1, roles: ['ROLE_USER'] });
    await fixture.whenStable();
  });

  it('affiche le refus du backend sans vider la saisie', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#connexion-email', 'jordan@exemple.cm');
    saisir(racine, '#connexion-mot-de-passe', 'faux');
    await fixture.whenStable();

    envoyer(racine);
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectOne(`${BASE}/auth/authenticate`).flush(
      {
        timestamp: '2026-08-19T11:00:43',
        status: 401,
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect',
        path: '/api/v1/auth/authenticate',
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    // Deux passes : la première laisse la promesse de soumission se rejeter, la seconde
    // affiche ce que le composant en a tiré.
    await fixture.whenStable();
    await fixture.whenStable();

    expect(racine.querySelector('.carte-auth__bandeau')?.textContent).toContain(
      'Email ou mot de passe incorrect',
    );
    expect(racine.querySelector<HTMLInputElement>('#connexion-email')?.value).toBe(
      'jordan@exemple.cm',
    );
  });

  it('signale les champs vides sans appeler le serveur', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    envoyer(racine);
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectNone(`${BASE}/auth/authenticate`);
    expect(racine.textContent).toContain("L'email est obligatoire");
    expect(racine.textContent).toContain('Le mot de passe est obligatoire');
  });
});
