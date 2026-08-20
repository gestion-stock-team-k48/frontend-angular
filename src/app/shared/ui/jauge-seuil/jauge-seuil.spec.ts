import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { JaugeSeuil } from './jauge-seuil';

@Component({
  imports: [JaugeSeuil],
  template: `<app-jauge-seuil
    [stock]="stock()"
    [seuil]="seuil()"
    [taille]="taille()"
    [article]="article()"
  />`,
})
class Hote {
  readonly stock = signal(50);
  readonly seuil = signal(20);
  readonly taille = signal<'inline' | 'moyenne' | 'grande'>('inline');
  readonly article = signal<string | null>('Ciment 50 kg');
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

function jauge(fixture: Awaited<ReturnType<typeof monter>>): HTMLElement {
  const element = (fixture.nativeElement as HTMLElement).querySelector('app-jauge-seuil');
  if (element === null) {
    throw new Error('jauge absente du gabarit');
  }
  return element as HTMLElement;
}

describe('JaugeSeuil', () => {
  it('classe le stock au-dessus du seuil comme correct', async () => {
    const fixture = await monter();
    expect(jauge(fixture).dataset['etat']).toBe('ok');
  });

  it('signale un stock passé sous le seuil', async () => {
    const fixture = await monter();
    fixture.componentInstance.stock.set(12);
    await fixture.whenStable();

    expect(jauge(fixture).dataset['etat']).toBe('bas');
  });

  it('signale une rupture, y compris sur un stock négatif', async () => {
    const fixture = await monter();

    for (const valeur of [0, -3]) {
      fixture.componentInstance.stock.set(valeur);
      await fixture.whenStable();
      expect(jauge(fixture).dataset['etat']).toBe('rupture');
    }
  });

  it('place le repère de seuil à la moitié, quelle que soit l’échelle', async () => {
    const fixture = await monter();

    for (const seuil of [5, 20, 400]) {
      fixture.componentInstance.seuil.set(seuil);
      await fixture.whenStable();

      const repere = jauge(fixture).querySelector<HTMLElement>('.jauge__repere');
      expect(repere?.style.insetInlineStart).toBe('50%');
    }
  });

  it('plafonne le remplissage au lieu de déborder sur un stock énorme', async () => {
    const fixture = await monter();
    fixture.componentInstance.stock.set(100_000);
    await fixture.whenStable();

    const remplissage = jauge(fixture).querySelector<HTMLElement>('.jauge__remplissage');
    expect(remplissage?.style.inlineSize).toBe('100%');
  });

  it('annonce l’article, l’état et les deux chiffres', async () => {
    const fixture = await monter();
    fixture.componentInstance.stock.set(12);
    await fixture.whenStable();

    const libelle = jauge(fixture).getAttribute('aria-label');
    expect(libelle).toContain('Ciment 50 kg');
    expect(libelle).toContain('Sous le seuil');
    expect(libelle).toContain('12 en stock pour un seuil de 20');
  });

  it('expose les attributs de la sémantique meter', async () => {
    const fixture = await monter();
    const element = jauge(fixture);

    expect(element.getAttribute('role')).toBe('meter');
    expect(element.getAttribute('aria-valuenow')).toBe('50');
    expect(element.getAttribute('aria-valuemin')).toBe('0');
    expect(element.getAttribute('aria-valuemax')).toBe('40');
  });

  it('n’affiche les chiffres qu’au-delà de la taille inline', async () => {
    const fixture = await monter();
    expect(jauge(fixture).querySelector('.jauge__mesures')).toBeNull();

    fixture.componentInstance.taille.set('moyenne');
    await fixture.whenStable();

    expect(jauge(fixture).querySelector('.jauge__mesures')).not.toBeNull();
  });

  it('ne dessine pas de repère quand aucun seuil n’est défini', async () => {
    const fixture = await monter();
    fixture.componentInstance.seuil.set(0);
    await fixture.whenStable();

    expect(jauge(fixture).querySelector('.jauge__repere')).toBeNull();
  });
});
