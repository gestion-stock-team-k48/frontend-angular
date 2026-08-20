import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { FilAriane } from './fil-ariane';

@Component({ template: '' })
class Vide {}

async function naviguerVers(chemin: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'parametres/apparence', component: Vide },
        { path: 'commandes-client/12', component: Vide },
      ]),
    ],
  });

  await TestBed.inject(Router).navigateByUrl(chemin);

  const fixture = TestBed.createComponent(FilAriane);
  await fixture.whenStable();
  return fixture;
}

describe('FilAriane', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('reprend le libellé métier quand la navigation le déclare', async () => {
    const fixture = await naviguerVers('/parametres/apparence');

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Apparence');
  });

  it('adoucit un segment inconnu plutôt que de l’afficher tel quel', async () => {
    const fixture = await naviguerVers('/commandes-client/12');
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texte).toContain('Commandes client');
    expect(texte).toContain('12');
  });

  it('marque le dernier segment comme page courante', async () => {
    const fixture = await naviguerVers('/parametres/apparence');
    const courant = (fixture.nativeElement as HTMLElement).querySelector('[aria-current="page"]');

    expect(courant?.textContent?.trim()).toBe('Apparence');
  });
});
