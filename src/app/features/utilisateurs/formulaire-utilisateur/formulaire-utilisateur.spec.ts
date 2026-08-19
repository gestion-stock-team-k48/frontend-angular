import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { FormulaireUtilisateur } from './formulaire-utilisateur';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Utilisateur } from '../../../core/api/api-types';

const URL = '/api/v1/utilisateurs';

const UTILISATEUR: Utilisateur = {
  id: 2,
  nom: 'Ngono',
  prenom: 'Alice',
  email: 'alice@exemple.cm',
  roles: ['ROLE_USER'],
  ville: 'Douala',
};

async function monter(id: string | null = null) {
  await TestBed.configureTestingModule({
    imports: [FormulaireUtilisateur],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(id === null ? {} : { id }) } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(FormulaireUtilisateur);
  fixture.detectChanges();

  if (id !== null) {
    TestBed.inject(HttpTestingController).expectOne(`${URL}/${id}`).flush(UTILISATEUR);
  }
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

function cocher(racine: HTMLElement, rang: number, coche: boolean): void {
  const cases = racine.querySelectorAll<HTMLInputElement>('.compte__role input');
  const controle = cases[rang];
  if (controle === undefined) {
    throw new Error(`Case de rôle introuvable : ${rang}`);
  }
  controle.checked = coche;
  controle.dispatchEvent(new Event('change'));
}

async function envoyer(fixture: Awaited<ReturnType<typeof monter>>): Promise<void> {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
  for (let tour = 0; tour < 5; tour += 1) {
    await Promise.resolve();
    fixture.detectChanges();
  }
}

describe('FormulaireUtilisateur', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('ne demande aucun mot de passe et dit pourquoi', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('input[type="password"]')).toBeNull();
    expect(racine.textContent).toContain('le serveur en génère un et l');
  });

  it('crée un compte avec le rôle coché', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#compte-nom', 'Ngono');
    saisir(racine, '#compte-prenom', 'Alice');
    saisir(racine, '#compte-email', 'alice@exemple.cm');
    cocher(racine, 1, true);
    await fixture.whenStable();

    await envoyer(fixture);

    const requete = TestBed.inject(HttpTestingController).expectOne({ url: URL, method: 'POST' });
    expect(requete.request.body).toEqual({
      nom: 'Ngono',
      prenom: 'Alice',
      email: 'alice@exemple.cm',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
    });

    requete.flush(UTILISATEUR);
    await fixture.whenStable();
  });

  it('refuse un compte sans aucun rôle', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#compte-nom', 'Ngono');
    saisir(racine, '#compte-prenom', 'Alice');
    saisir(racine, '#compte-email', 'alice@exemple.cm');
    cocher(racine, 0, false);
    await fixture.whenStable();

    await envoyer(fixture);

    TestBed.inject(HttpTestingController).expectNone({ url: URL, method: 'POST' });
    expect(racine.textContent).toContain('Au moins un rôle est obligatoire');
  });

  it('reprend le compte à modifier, rôles compris', async () => {
    const fixture = await monter('2');
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector<HTMLInputElement>('#compte-nom')?.value).toBe('Ngono');
    expect(racine.querySelector<HTMLInputElement>('#compte-ville')?.value).toBe('Douala');

    const cases = racine.querySelectorAll<HTMLInputElement>('.compte__role input');
    expect(cases[0]?.checked).toBe(true);
    expect(cases[1]?.checked).toBe(false);
    // Le message d'accueil de la création n'a rien à faire ici.
    expect(racine.textContent).not.toContain('le serveur en génère un');
  });
});
