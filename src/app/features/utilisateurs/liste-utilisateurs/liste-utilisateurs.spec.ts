import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { ListeUtilisateurs } from './liste-utilisateurs';
import { provideAppConfig } from '../../../core/config/app-config';
import { ServiceAuthentification } from '../../../core/auth/auth';
import type { Utilisateur } from '../../../core/api/api-types';

const URL = '/api/v1/utilisateurs';

const MOI: Utilisateur = {
  id: 1,
  nom: 'Nandjo',
  prenom: 'Jordan',
  email: 'jordan@exemple.cm',
  roles: ['ROLE_ADMIN'],
};

const COLLEGUE: Utilisateur = {
  id: 2,
  nom: 'Ngono',
  prenom: 'Alice',
  email: 'alice@exemple.cm',
  roles: ['ROLE_USER'],
  mustChangePassword: true,
};

function page(contenu: Utilisateur[]) {
  return {
    content: contenu,
    pageNumber: 0,
    pageSize: 20,
    totalElements: contenu.length,
    totalPages: 1,
    isLast: true,
  };
}

async function monter(contenu: Utilisateur[] = [MOI, COLLEGUE]) {
  await TestBed.configureTestingModule({
    imports: [ListeUtilisateurs],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ListeUtilisateurs);
  fixture.detectChanges();

  const http = TestBed.inject(HttpTestingController);
  // Le profil courant : c'est lui qui dit quelle ligne est la mienne.
  TestBed.inject(ServiceAuthentification).chargerUtilisateur().subscribe();
  http.expectOne(`${URL}/me`).flush(MOI);
  http.expectOne((requete) => requete.url === URL).flush(page(contenu));
  await fixture.whenStable();

  return fixture;
}

describe('ListeUtilisateurs', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('signale un compte encore porteur de son mot de passe temporaire', async () => {
    const fixture = await monter();
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(lignes[1]?.textContent).toContain('Temporaire');
    expect(lignes[0]?.textContent).toContain('Choisi');
  });

  it('n’offre pas de supprimer son propre compte', async () => {
    const fixture = await monter();
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    // Le backend l'accepterait ; l'administrateur se fermerait la porte au nez.
    expect(lignes[0]?.textContent).not.toContain('Supprimer');
    expect(lignes[1]?.textContent).toContain('Supprimer');
  });

  it('supprime un autre compte après confirmation', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    const supprimer = Array.from(racine.querySelectorAll('tbody button')).find((bouton) =>
      bouton.textContent?.includes('Supprimer'),
    );
    (supprimer as HTMLButtonElement).click();
    await fixture.whenStable();

    const confirmer = Array.from(racine.querySelectorAll('dialog button')).find((bouton) =>
      bouton.textContent?.trim().startsWith('Supprimer'),
    );
    (confirmer as HTMLButtonElement).click();
    for (let tour = 0; tour < 4; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    const http = TestBed.inject(HttpTestingController);
    http.expectOne({ url: `${URL}/2`, method: 'DELETE' }).flush(null);
    for (let tour = 0; tour < 3; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    http.expectOne((requete) => requete.url === URL).flush(page([MOI]));
    await fixture.whenStable();

    // La revendication du test, écrite : le compte a disparu de la liste, et l'écran s'est
    // rechargé depuis le serveur au lieu de retirer la ligne de son côté.
    const restantes = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(restantes).toHaveLength(1);
    expect(restantes[0]?.textContent).toContain(MOI.nom);
  });
});
