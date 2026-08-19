import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { EcranEntreprise } from './ecran-entreprise';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Entreprise } from '../../../core/api/api-types';

const URL = '/api/v1/entreprises/me';

const ENTREPRISE: Entreprise = {
  id: 1,
  nom: 'Quincaillerie du Centre',
  codeFiscal: 'M0123',
  email: 'contact@exemple.cm',
  ville: 'Douala',
};

async function monter() {
  await TestBed.configureTestingModule({
    imports: [EcranEntreprise],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideAppConfig()],
  }).compileComponents();

  const fixture = TestBed.createComponent(EcranEntreprise);
  fixture.detectChanges();

  TestBed.inject(HttpTestingController).expectOne(URL).flush(ENTREPRISE);
  await fixture.whenStable();

  return fixture;
}

describe('EcranEntreprise', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('reprend la fiche renvoyée par le serveur', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector<HTMLInputElement>('#entreprise-nom')?.value).toBe(
      'Quincaillerie du Centre',
    );
    expect(racine.querySelector<HTMLInputElement>('#entreprise-ville')?.value).toBe('Douala');
  });

  it('n’offre pas de logo, faute d’endpoint pour l’envoyer', async () => {
    const fixture = await monter();

    expect((fixture.nativeElement as HTMLElement).querySelector('input[type="file"]')).toBeNull();
  });

  it('n’envoie pas les champs facultatifs restés vides', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    racine.querySelector('form')?.dispatchEvent(new Event('submit'));
    for (let tour = 0; tour < 5; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    const requete = TestBed.inject(HttpTestingController).expectOne({ url: URL, method: 'PUT' });
    expect(requete.request.body).toEqual({
      nom: 'Quincaillerie du Centre',
      codeFiscal: 'M0123',
      email: 'contact@exemple.cm',
      ville: 'Douala',
    });

    requete.flush(ENTREPRISE);
    // L'enregistrement relit la fiche : le rechargement part au tour suivant.
    for (let tour = 0; tour < 4; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    TestBed.inject(HttpTestingController).expectOne(URL).flush(ENTREPRISE);
    await fixture.whenStable();
  });
});
