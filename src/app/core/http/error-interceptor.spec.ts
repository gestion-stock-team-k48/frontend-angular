import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { intercepteurErreurs } from './error-interceptor';
import { SANS_NOTIFICATION_ERREUR } from './http-contexte';
import { ServiceNotifications } from '../notifications/notifications';

describe('intercepteurErreurs', () => {
  let http: HttpClient;
  let controleur: HttpTestingController;
  let notifications: ServiceNotifications;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([intercepteurErreurs])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controleur = TestBed.inject(HttpTestingController);
    notifications = TestBed.inject(ServiceNotifications);
  });

  it('notifie un refus métier que personne d’autre n’affiche', () => {
    http.post('/api/v1/categories', {}).subscribe({ error: () => undefined });

    controleur
      .expectOne('/api/v1/categories')
      .flush(
        { status: 409, message: 'Ce code existe déjà', path: '/api/v1/categories' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(notifications.notifications()).toHaveLength(1);
    expect(notifications.notifications()[0]?.message).toBe('Ce code existe déjà');
  });

  it('se tait quand l’écran affiche déjà l’erreur lui-même', () => {
    http
      .post(
        '/api/v1/categories',
        {},
        { context: new HttpContext().set(SANS_NOTIFICATION_ERREUR, true) },
      )
      .subscribe({ error: () => undefined });

    controleur
      .expectOne('/api/v1/categories')
      .flush(
        { status: 409, message: 'Ce code existe déjà', path: '/api/v1/categories' },
        { status: 409, statusText: 'Conflict' },
      );

    // Le message reste affiché par le formulaire : le doubler d'une notification écrirait
    // deux fois la même phrase.
    expect(notifications.notifications()).toHaveLength(0);
  });

  it('se tait aussi sur une erreur de validation, portée par les champs', () => {
    http.post('/api/v1/categories', {}).subscribe({ error: () => undefined });

    controleur.expectOne('/api/v1/categories').flush(
      {
        status: 400,
        message: 'Un ou plusieurs champs sont invalides.',
        path: '/api/v1/categories',
        validationErrors: { code: 'Le code est obligatoire' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(notifications.notifications()).toHaveLength(0);
  });
});
