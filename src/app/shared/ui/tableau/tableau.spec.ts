import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tableau, type ColonneTableau, type EtatTableau } from './tableau';
import type { Tri } from '../../../core/api/pagination';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'code', libelle: 'Code', triable: true },
  { cle: 'designation', libelle: 'Désignation' },
];

@Component({
  imports: [Tableau],
  template: `<app-tableau
    [colonnes]="colonnes"
    [etat]="etat()"
    [tri]="tri()"
    [lignesSquelette]="3"
    libelleActions="Actions"
    (triChange)="dernierTri.set($event)"
  >
    <tr>
      <td>ART-001</td>
      <td>Ciment</td>
      <td>—</td>
    </tr>
    <p zoneEtat>Rien à afficher</p>
  </app-tableau>`,
})
class Hote {
  readonly colonnes = COLONNES;
  readonly etat = signal<EtatTableau>('pret');
  readonly tri = signal<Tri | null>({ champ: 'code', sens: 'asc' });
  readonly dernierTri = signal<Tri | null>(null);
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

describe('Tableau', () => {
  it('rend les en-têtes et la colonne d’actions', async () => {
    const fixture = await monter();
    const entetes = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('th')).map(
      (cellule) => cellule.textContent?.trim(),
    );

    expect(entetes[0]).toContain('Code');
    expect(entetes[1]).toContain('Désignation');
    expect(entetes[2]).toContain('Actions');
  });

  it('annonce le tri courant aux technologies d’assistance', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelectorAll('th')[0]?.getAttribute('aria-sort')).toBe('ascending');
    // Une colonne non triable ne prétend pas l'être.
    expect(racine.querySelectorAll('th')[1]?.getAttribute('aria-sort')).toBeNull();
  });

  it('inverse le sens au second clic sur la même colonne', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    racine.querySelector<HTMLButtonElement>('.tableau__tri')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.dernierTri()).toEqual({ champ: 'code', sens: 'desc' });
  });

  it('occupe la place des lignes pendant le chargement', async () => {
    const fixture = await monter();
    fixture.componentInstance.etat.set('chargement');
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(racine.textContent).not.toContain('ART-001');
  });

  it('laisse la place à l’état vide, sans lignes', async () => {
    const fixture = await monter();
    fixture.componentInstance.etat.set('vide');
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.tableau__zone-etat')?.textContent).toContain('Rien à afficher');
    expect(racine.textContent).not.toContain('ART-001');
  });
});
