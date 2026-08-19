import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { intercepteurAuthentification } from './auth-interceptor';
import { intercepteurRafraichissement } from './refresh-interceptor';
import { ServiceAuthentification } from './auth';
import { provideAppConfig } from '../config/app-config';

const BASE = '/api/v1';

describe('intercepteurRafraichissement', () => {
  let http: HttpClient;
  let controleur: HttpTestingController;
  let auth: ServiceAuthentification;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([intercepteurAuthentification, intercepteurRafraichissement]),
        ),
        provideHttpClientTesting(),
        provideAppConfig(),
        // La route de connexion doit exister : l'échec du rafraîchissement y redirige.
        provideRouter([{ path: 'connexion', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controleur = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(ServiceAuthentification);
  });

  it('rejoue la requête refusée avec le jeton rafraîchi', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-refresh');

    let recu: unknown = null;
    http.get(`${BASE}/articles`).subscribe((reponse) => (recu = reponse));

    // Ce backend répond 403 — et non 401 — quand le jeton manque ou n'est plus valide.
    controleur.expectOne(`${BASE}/articles`).flush(null, { status: 403, statusText: 'Forbidden' });

    controleur
      .expectOne(`${BASE}/auth/refresh-token`)
      .flush({ token: 'jeton-neuf', refreshToken: 'refresh-neuf' });

    const rejouee = controleur.expectOne(`${BASE}/articles`);
    expect(rejouee.request.headers.get('Authorization')).toBe('Bearer jeton-neuf');
    rejouee.flush({ content: [], totalElements: 0 });

    expect(recu).toEqual({ content: [], totalElements: 0 });
  });

  it('ne rafraîchit qu’une fois pour plusieurs requêtes refusées simultanément', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-refresh');

    http.get(`${BASE}/articles`).subscribe();
    http.get(`${BASE}/clients`).subscribe();

    controleur
      .expectOne(`${BASE}/articles`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    controleur
      .expectOne(`${BASE}/clients`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    // Un seul appel de rafraîchissement, alors que deux requêtes ont été refusées.
    controleur
      .expectOne(`${BASE}/auth/refresh-token`)
      .flush({ token: 'jeton-neuf', refreshToken: 'refresh-neuf' });

    controleur.expectOne(`${BASE}/articles`).flush({});
    controleur.expectOne(`${BASE}/clients`).flush({});
    controleur.verify();
  });

  it('ne tente rien sans jeton de rafraîchissement', () => {
    let statut = 0;
    http.get(`${BASE}/articles`).subscribe({
      error: (erreur: { status: number }) => (statut = erreur.status),
    });

    controleur.expectOne(`${BASE}/articles`).flush(null, { status: 403, statusText: 'Forbidden' });

    controleur.expectNone(`${BASE}/auth/refresh-token`);
    expect(statut).toBe(403);
  });

  it('ne boucle pas quand c’est le rafraîchissement lui-même qui échoue', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-expire');

    let statut = 0;
    http.get(`${BASE}/articles`).subscribe({
      error: (erreur: { status: number }) => (statut = erreur.status),
    });

    controleur
      .expectOne(`${BASE}/articles`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    controleur
      .expectOne(`${BASE}/auth/refresh-token`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    controleur.verify();
    expect(statut).toBe(401);
    expect(auth.estAuthentifie()).toBe(false);
  });

  it('laisse passer les autres erreurs sans y toucher', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton-refresh');

    let statut = 0;
    http.get(`${BASE}/articles/999`).subscribe({
      error: (erreur: { status: number }) => (statut = erreur.status),
    });

    controleur
      .expectOne(`${BASE}/articles/999`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    controleur.expectNone(`${BASE}/auth/refresh-token`);
    expect(statut).toBe(404);
  });
});
