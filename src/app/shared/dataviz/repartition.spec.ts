import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Repartition } from './repartition';
import type { PartRepartition } from './serie';

const PARTS: PartRepartition[] = [
  { libelle: 'En préparation', valeur: 2, ton: 'neutre' },
  { libelle: 'Validées', valeur: 6, ton: 'information' },
  { libelle: 'Livrées', valeur: 12, ton: 'succes' },
  { libelle: 'Annulées', valeur: 0, ton: 'danger' },
];

@Component({
  imports: [Repartition],
  template: `<app-repartition titre="Commandes par état" [parts]="parts" />`,
})
class Hote {
  readonly parts = PARTS;
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

describe('Repartition', () => {
  it('n’empile que les parts non nulles', async () => {
    const fixture = await monter();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.graphique__part'),
    ).toHaveLength(3);
  });

  it('nomme chaque part : la couleur ne travaille jamais seule', async () => {
    const fixture = await monter();
    const legende = (fixture.nativeElement as HTMLElement).querySelector('.graphique__legende');

    expect(legende?.textContent).toContain('Livrées');
    expect(legende?.textContent).toContain('60 %');
    // Une part vide reste en légende : son absence est une information.
    expect(legende?.textContent).toContain('Annulées');
  });
});
