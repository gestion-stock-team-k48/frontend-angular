import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ServiceAuthentification } from './auth';
import { provideAppConfig } from '../config/app-config';
import type { Utilisateur } from '../api/api-types';

const BASE = '/api/v1';

const UTILISATEUR: Utilisateur = {
  id: 1,
  nom: 'Nandjo',
  prenom: 'Jordan',
  email: 'jordan@exemple.cm',
  entrepriseId: 7,
  entrepriseNom: 'Quincaillerie du Centre',
  roles: ['ROLE_ADMIN'],
};

describe('ServiceAuthentification', () => {
  let service: ServiceAuthentification;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppConfig()],
    });
    service = TestBed.inject(ServiceAuthentification);
    http = TestBed.inject(HttpTestingController);
  });

  it('conserve le jeton d’accès en mémoire et le seul jeton de rafraîchissement sur le disque', () => {
    service.authentifier({ email: 'jordan@exemple.cm', motDePasse: 'secret' }).subscribe();

    http
      .expectOne(`${BASE}/auth/authenticate`)
      .flush({ token: 'jeton-acces', refreshToken: 'jeton-refresh' });
    http.expectOne(`${BASE}/utilisateurs/me`).flush(UTILISATEUR);

    expect(service.jeton()).toBe('jeton-acces');
    expect(service.jetonRafraichissement()).toBe('jeton-refresh');
    expect(localStorage.getItem('gestion-stock.refresh-token')).toBe('jeton-refresh');
    // Le jeton d'accès ne doit apparaître nulle part dans le stockage persistant (ADR-003).
    expect(JSON.stringify(localStorage)).not.toContain('jeton-acces');
  });

  it('expose les rôles et l’entreprise après le chargement du profil', () => {
    service.authentifier({ email: 'jordan@exemple.cm', motDePasse: 'secret' }).subscribe();
    http.expectOne(`${BASE}/auth/authenticate`).flush({ token: 'a', refreshToken: 'r' });
    http.expectOne(`${BASE}/utilisateurs/me`).flush(UTILISATEUR);

    expect(service.estAdministrateur()).toBe(true);
    expect(service.aRole('ROLE_USER')).toBe(false);
    expect(service.entreprise()).toEqual({ id: 7, nom: 'Quincaillerie du Centre' });
  });

  it('ne déclenche qu’un seul appel de rafraîchissement pour plusieurs demandes simultanées', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-refresh');

    const jetonsObtenus: string[] = [];
    service.rafraichir().subscribe((jeton) => jetonsObtenus.push(jeton));
    service.rafraichir().subscribe((jeton) => jetonsObtenus.push(jeton));
    service.rafraichir().subscribe((jeton) => jetonsObtenus.push(jeton));

    // Un seul appel réseau, malgré trois demandeurs : c'est tout l'objet du single-flight.
    const requete = http.expectOne(`${BASE}/auth/refresh-token`);
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton-refresh');
    expect(requete.request.body).toBeNull();

    requete.flush({ token: 'nouveau-jeton', refreshToken: 'nouveau-refresh' });

    expect(jetonsObtenus).toEqual(['nouveau-jeton', 'nouveau-jeton', 'nouveau-jeton']);
    expect(service.jeton()).toBe('nouveau-jeton');
  });

  it('autorise un nouveau rafraîchissement une fois le précédent terminé', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'r1');

    service.rafraichir().subscribe();
    http.expectOne(`${BASE}/auth/refresh-token`).flush({ token: 't1', refreshToken: 'r2' });

    service.rafraichir().subscribe();
    http.expectOne(`${BASE}/auth/refresh-token`).flush({ token: 't2', refreshToken: 'r3' });

    expect(service.jeton()).toBe('t2');
  });

  it('déconnecte proprement quand le rafraîchissement est refusé', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-expire');

    let erreurRecue: unknown = null;
    service.rafraichir().subscribe({ error: (erreur: unknown) => (erreurRecue = erreur) });

    http
      .expectOne(`${BASE}/auth/refresh-token`)
      .flush({ message: 'Refresh token expiré' }, { status: 401, statusText: 'Unauthorized' });

    expect(erreurRecue).not.toBeNull();
    expect(service.estAuthentifie()).toBe(false);
    expect(service.jeton()).toBeNull();
    expect(localStorage.getItem('gestion-stock.refresh-token')).toBeNull();
  });

  it('échoue sans appel réseau si aucun jeton de rafraîchissement n’est disponible', () => {
    let erreurRecue: unknown = null;
    service.rafraichir().subscribe({ error: (erreur: unknown) => (erreurRecue = erreur) });

    expect(erreurRecue).not.toBeNull();
    http.expectNone(`${BASE}/auth/refresh-token`);
  });

  it('considère la session ouverte après un rechargement, avant même le rafraîchissement', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-survivant');

    expect(service.jeton()).toBeNull();
    expect(service.estAuthentifie()).toBe(true);
  });
});
