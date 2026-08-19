import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  UrlTree,
  provideRouter,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { gardeAuthentification, gardeInvite, gardeMotDePasse, gardeRole } from './guards';
import { ServiceAuthentification } from './auth';
import { provideAppConfig } from '../config/app-config';
import type { Utilisateur } from '../api/api-types';

const ROUTE = {} as ActivatedRouteSnapshot;
const etat = (url: string) => ({ url }) as RouterStateSnapshot;

const ADMIN: Utilisateur = { id: 1, email: 'a@b.cm', roles: ['ROLE_ADMIN'] };
const SIMPLE: Utilisateur = { id: 2, email: 'c@d.cm', roles: ['ROLE_USER'] };

describe('gardes de navigation', () => {
  let injector: Injector;
  let auth: ServiceAuthentification;

  /** Ouvre une session complète : jeton de rafraîchissement présent et profil chargé. */
  function ouvrirSession(utilisateur: Utilisateur): void {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton');
    auth.chargerUtilisateur().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/utilisateurs/me').flush(utilisateur);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppConfig(),
        provideRouter([]),
      ],
    });
    injector = TestBed.inject(Injector);
    auth = TestBed.inject(ServiceAuthentification);
  });

  it('laisse passer une session ouverte', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton');

    const resultat = runInInjectionContext(injector, () =>
      gardeAuthentification(ROUTE, etat('/articles')),
    );

    expect(resultat).toBe(true);
  });

  it('renvoie vers la connexion en mémorisant l’écran demandé', () => {
    const resultat = runInInjectionContext(injector, () =>
      gardeAuthentification(ROUTE, etat('/articles/12')),
    );

    expect(resultat).toBeInstanceOf(UrlTree);
    expect(String(resultat)).toContain('returnUrl=%2Farticles%2F12');
  });

  it('réserve une route au rôle demandé', () => {
    ouvrirSession(ADMIN);

    const pourAdmin = runInInjectionContext(injector, () =>
      gardeRole('ROLE_ADMIN')(ROUTE, etat('/utilisateurs')),
    );

    expect(pourAdmin).toBe(true);
  });

  it('renvoie vers l’accès refusé quand le rôle ne suffit pas', () => {
    ouvrirSession(SIMPLE);

    const resultat = runInInjectionContext(injector, () =>
      gardeRole('ROLE_ADMIN')(ROUTE, etat('/utilisateurs')),
    );

    expect(String(resultat)).toContain('/acces-refuse');
  });

  it('détourne un utilisateur déjà connecté des écrans de connexion', () => {
    localStorage.setItem('gestion-stock.refresh-token', 'jeton');

    const resultat = runInInjectionContext(injector, () => gardeInvite(ROUTE, etat('/connexion')));

    expect(resultat).toBeInstanceOf(UrlTree);
  });

  it('laisse un visiteur atteindre la connexion', () => {
    const resultat = runInInjectionContext(injector, () => gardeInvite(ROUTE, etat('/connexion')));

    expect(resultat).toBe(true);
  });
  it('détourne vers le changement de mot de passe tant qu’il est temporaire', () => {
    ouvrirSession({ ...SIMPLE, mustChangePassword: true });

    const resultat = runInInjectionContext(injector, () =>
      gardeMotDePasse(ROUTE, etat('/articles')),
    );

    expect(String(resultat)).toContain('/changer-mot-de-passe');
  });

  it('laisse passer un mot de passe déjà choisi par l’utilisateur', () => {
    ouvrirSession(SIMPLE);

    const resultat = runInInjectionContext(injector, () =>
      gardeMotDePasse(ROUTE, etat('/articles')),
    );

    expect(resultat).toBe(true);
  });
});
