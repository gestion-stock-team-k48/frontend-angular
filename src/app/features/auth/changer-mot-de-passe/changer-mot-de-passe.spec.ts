import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChangerMotDePasse } from './changer-mot-de-passe';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { provideAppConfig } from '../../../core/config/app-config';

const BASE = '/api/v1';

async function monter() {
  await TestBed.configureTestingModule({
    imports: [ChangerMotDePasse],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ChangerMotDePasse);
  await fixture.whenStable();
  return fixture;
}

function saisir(racine: HTMLElement, selecteur: string, valeur: string): void {
  const controle = racine.querySelector<HTMLInputElement>(selecteur);
  if (controle === null) {
    throw new Error(`Contrôle introuvable : ${selecteur}`);
  }
  controle.value = valeur;
  controle.dispatchEvent(new Event('input'));
}

async function remplirEtEnvoyer(
  fixture: Awaited<ReturnType<typeof monter>>,
  nouveau: string,
  confirmation: string,
): Promise<void> {
  const racine = fixture.nativeElement as HTMLElement;
  saisir(racine, '#mdp-actuel', 'temporaire');
  saisir(racine, '#mdp-nouveau', nouveau);
  saisir(racine, '#mdp-confirmation', confirmation);
  await fixture.whenStable();

  racine.querySelector('form')?.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
}

describe('ChangerMotDePasse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('refuse une confirmation qui ne correspond pas, sans appeler le serveur', async () => {
    const fixture = await monter();

    await remplirEtEnvoyer(fixture, 'nouveaumotdepasse', 'nouveaumotdepass');

    TestBed.inject(HttpTestingController).expectNone(`${BASE}/utilisateurs/change-password`);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Les deux mots de passe ne sont pas identiques',
    );
  });

  it('refuse un nouveau mot de passe identique à l’ancien', async () => {
    const fixture = await monter();

    await remplirEtEnvoyer(fixture, 'temporaire', 'temporaire');

    TestBed.inject(HttpTestingController).expectNone(`${BASE}/utilisateurs/change-password`);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "Le nouveau mot de passe doit différer de l'ancien",
    );
  });

  it('affiche le refus de l’ancien mot de passe sans fermer la session', async () => {
    const fixture = await monter();
    localStorage.setItem('gestion-stock.refresh-token', 'jeton');

    await remplirEtEnvoyer(fixture, 'nouveaumotdepasse', 'nouveaumotdepasse');

    TestBed.inject(HttpTestingController).expectOne(`${BASE}/utilisateurs/change-password`).flush(
      {
        timestamp: '2026-08-19T11:00:43',
        status: 401,
        error: 'Unauthorized',
        message: "L'ancien mot de passe est incorrect",
        path: '/api/v1/utilisateurs/change-password',
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.carte-auth__bandeau')?.textContent).toContain(
      "L'ancien mot de passe est incorrect",
    );
    expect(TestBed.inject(ServiceAuthentification).estAuthentifie()).toBe(true);
  });

  it('annonce le mot de passe temporaire quand le profil l’impose', async () => {
    const fixture = await monter();

    TestBed.inject(ServiceAuthentification).chargerUtilisateur().subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne(`${BASE}/utilisateurs/me`)
      .flush({ id: 1, roles: ['ROLE_USER'], mustChangePassword: true });
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.textContent).toContain('mot de passe temporaire');
    expect(racine.querySelector('a[href="/"]')).toBeNull();
  });
});
