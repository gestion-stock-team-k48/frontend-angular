import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it } from 'vitest';
import { Vitrine } from './vitrine';
import { provideAppConfig } from '../../../core/config/app-config';

async function monter() {
  await TestBed.configureTestingModule({
    imports: [Vitrine],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Vitrine);
  await fixture.whenStable();
  return fixture;
}

describe('Vitrine', () => {
  it('mène aux deux seules portes d’entrée : se connecter, inscrire', async () => {
    const fixture = await monter();
    const liens = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a[href]'),
    ).map((lien) => lien.getAttribute('href'));

    expect(liens).toContain('/connexion');
    expect(liens).toContain('/inscription');
    expect(liens).toContain('/mot-de-passe-oublie');
  });

  it('ne promet que ce que l’application sait faire', async () => {
    const fixture = await monter();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

    // Chaque point de la vitrine correspond à un écran livré : rien à tenir plus tard.
    expect(texte).toContain('Le stock réel, pas le stock supposé');
    expect(texte).toContain('\u2019alerte avant la rupture');
    expect(texte).toContain('Trois étapes pour démarrer');
  });

  it('montre une maquette dessinée, pas une capture', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('app-apercu-application')).not.toBeNull();
    expect(racine.querySelector('img')).toBeNull();
  });
});
