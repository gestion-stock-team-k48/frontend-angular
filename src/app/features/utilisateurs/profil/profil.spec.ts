import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { Profil } from './profil';
import { provideAppConfig } from '../../../core/config/app-config';
import { ServiceAuthentification } from '../../../core/auth/auth';
import type { Utilisateur } from '../../../core/api/api-types';

const URL_MOI = '/api/v1/utilisateurs/me';

const MOI: Utilisateur = {
  id: 1,
  nom: 'Nandjo',
  prenom: 'Jordan',
  email: 'jordan@exemple.cm',
  ville: 'Yaoundé',
  roles: ['ROLE_ADMIN'],
};

async function monter() {
  await TestBed.configureTestingModule({
    imports: [Profil],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  TestBed.inject(ServiceAuthentification).chargerUtilisateur().subscribe();
  TestBed.inject(HttpTestingController).expectOne(URL_MOI).flush(MOI);

  const fixture = TestBed.createComponent(Profil);
  fixture.detectChanges();
  await fixture.whenStable();

  return fixture;
}

describe('Profil', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('montre l’email et les rôles sans permettre de les changer', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.textContent).toContain('jordan@exemple.cm');
    expect(racine.textContent).toContain('Administrateur');
    // `PUT /utilisateurs/me` n'accepte ni l'un ni les autres.
    expect(racine.querySelector('input[type="email"]')).toBeNull();
    expect(racine.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('envoie le profil et recharge le compte affiché dans le bandeau', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    const prenom = racine.querySelector<HTMLInputElement>('#profil-prenom');
    if (prenom === null) {
      throw new Error('Le champ prénom est absent');
    }
    prenom.value = 'Jordy';
    prenom.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    racine.querySelector('form')?.dispatchEvent(new Event('submit'));
    for (let tour = 0; tour < 5; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    const http = TestBed.inject(HttpTestingController);
    const envoi = http.expectOne({ url: URL_MOI, method: 'PUT' });
    expect(envoi.request.body).toEqual({
      nom: 'Nandjo',
      prenom: 'Jordy',
      ville: 'Yaoundé',
    });

    envoi.flush({ ...MOI, prenom: 'Jordy' });
    for (let tour = 0; tour < 3; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    http.expectOne({ url: URL_MOI, method: 'GET' }).flush({ ...MOI, prenom: 'Jordy' });
    await fixture.whenStable();
  });

  it('propose d’envoyer sa propre photo', async () => {
    const fixture = await monter();

    expect((fixture.nativeElement as HTMLElement).querySelector('#profil-photo')).not.toBeNull();
  });
});
