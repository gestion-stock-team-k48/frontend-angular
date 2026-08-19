import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Sidebar } from './sidebar';
import { ServiceAuthentification } from '../../core/auth/auth';
import { provideAppConfig } from '../../core/config/app-config';
import type { Utilisateur } from '../../core/api/api-types';

const ADMIN: Utilisateur = { id: 1, email: 'a@b.cm', roles: ['ROLE_ADMIN'] };
const SIMPLE: Utilisateur = { id: 2, email: 'c@d.cm', roles: ['ROLE_USER'] };

async function monter(utilisateur: Utilisateur | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  });

  if (utilisateur !== null) {
    TestBed.inject(ServiceAuthentification).chargerUtilisateur().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/utilisateurs/me').flush(utilisateur);
  }

  const fixture = TestBed.createComponent(Sidebar);
  await fixture.whenStable();
  return fixture;
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('montre les entrées d’administration à un administrateur', async () => {
    const fixture = await monter(ADMIN);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texte).toContain('Utilisateurs');
    expect(texte).toContain('Entreprise');
  });

  it('masque les entrées d’administration à un utilisateur simple', async () => {
    const fixture = await monter(SIMPLE);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texte).not.toContain('Utilisateurs');
    expect(texte).toContain('Articles');
  });

  it('affiche les écrans à venir, mais sans lien cliquable', async () => {
    const fixture = await monter(SIMPLE);
    const racine = fixture.nativeElement as HTMLElement;

    const liens = Array.from(racine.querySelectorAll('a')).map((lien) => lien.textContent?.trim());
    expect(liens).toContain('Apparence');
    expect(liens).toContain('Articles');
    // Écran non encore livré : l'entrée reste visible, mais n'est pas un lien.
    expect(liens).not.toContain('Tableau de bord');

    const indisponibles = racine.querySelectorAll('.sidebar__lien--indisponible');
    expect(indisponibles.length).toBeGreaterThan(0);
  });

  it('n’affiche aucun groupe vide', async () => {
    const fixture = await monter(SIMPLE);
    const groupes = (fixture.nativeElement as HTMLElement).querySelectorAll('.sidebar__groupe');

    for (const groupe of Array.from(groupes)) {
      expect(groupe.querySelectorAll('li').length).toBeGreaterThan(0);
    }
  });
});
