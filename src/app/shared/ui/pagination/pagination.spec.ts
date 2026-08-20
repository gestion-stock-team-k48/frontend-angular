import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Pagination } from './pagination';
import { etatDePage, type EtatPage } from '../../../core/api/pagination';

@Component({
  imports: [Pagination],
  template: `<app-pagination
    [etat]="etat()"
    (pageChange)="page.set($event)"
    (tailleChange)="taille.set($event)"
  />`,
})
class Hote {
  readonly etat = signal<EtatPage>(
    etatDePage({
      content: ['a', 'b', 'c'],
      pageNumber: 1,
      pageSize: 3,
      totalElements: 7,
      totalPages: 3,
      isLast: false,
    }),
  );
  readonly page = signal<number | null>(null);
  readonly taille = signal<number | null>(null);
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

describe('Pagination', () => {
  it('compte les éléments à partir de 1, comme l’utilisateur', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.pagination__compte')?.textContent).toContain('4–6 sur 7');
    expect(racine.querySelector('.pagination__position')?.textContent).toContain('Page 2 sur 3');
  });

  it('demande la page précédente en numérotation backend', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    racine.querySelectorAll<HTMLButtonElement>('.pagination__bouton')[0]?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.page()).toBe(0);
  });

  it('ferme la navigation aux extrémités', async () => {
    const fixture = await monter();
    fixture.componentInstance.etat.set(
      etatDePage({
        content: [],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 0,
        totalPages: 0,
        isLast: true,
      }),
    );
    await fixture.whenStable();

    const boutons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.pagination__bouton',
    );
    expect(boutons[0]?.disabled).toBe(true);
    expect(boutons[1]?.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucun élément');
  });
});
