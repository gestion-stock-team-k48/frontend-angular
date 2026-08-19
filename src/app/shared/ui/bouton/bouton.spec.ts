import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Bouton } from './bouton';

@Component({
  imports: [Bouton],
  template: `<app-bouton
    [chargement]="chargement()"
    [desactive]="desactive()"
    (presse)="clics.set(clics() + 1)"
  >
    Valider la commande
  </app-bouton>`,
})
class Hote {
  readonly chargement = signal(false);
  readonly desactive = signal(false);
  readonly clics = signal(0);
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

function bouton(fixture: Awaited<ReturnType<typeof monter>>): HTMLButtonElement {
  const element = (fixture.nativeElement as HTMLElement).querySelector('button');
  if (element === null) {
    throw new Error('bouton absent du gabarit');
  }
  return element;
}

describe('Bouton', () => {
  it('émet à la pression', async () => {
    const fixture = await monter();
    bouton(fixture).click();

    expect(fixture.componentInstance.clics()).toBe(1);
  });

  it('garde son libellé pendant le chargement, pour ne pas changer de largeur', async () => {
    const fixture = await monter();
    const largeurAvant = bouton(fixture).textContent?.trim();

    fixture.componentInstance.chargement.set(true);
    await fixture.whenStable();

    expect(bouton(fixture).textContent?.trim()).toContain(largeurAvant ?? '');
    expect(bouton(fixture).getAttribute('aria-busy')).toBe('true');
  });

  it('n’émet plus rien pendant le chargement ni une fois désactivé', async () => {
    const fixture = await monter();

    fixture.componentInstance.chargement.set(true);
    await fixture.whenStable();
    bouton(fixture).click();

    fixture.componentInstance.chargement.set(false);
    fixture.componentInstance.desactive.set(true);
    await fixture.whenStable();
    bouton(fixture).click();

    expect(fixture.componentInstance.clics()).toBe(0);
  });
});
