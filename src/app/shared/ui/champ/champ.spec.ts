import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Champ } from './champ';

@Component({
  imports: [Champ],
  template: `<app-champ
    libelle="Code article"
    identifiant="code"
    [aide]="aide()"
    [erreur]="erreur()"
    [requis]="true"
  >
    <input id="code" type="text" />
  </app-champ>`,
})
class Hote {
  readonly aide = signal<string | null>('Identifiant unique dans le catalogue');
  readonly erreur = signal<string | null>(null);
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

describe('Champ', () => {
  it('lie le libellé au contrôle projeté', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('label')?.getAttribute('for')).toBe('code');
  });

  it('affiche l’aide tant qu’aucune erreur ne la remplace', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.champ__aide')?.textContent).toContain('Identifiant unique');
    expect(racine.querySelector('.champ__erreur')).toBeNull();
  });

  it('remplace l’aide par l’erreur et l’annonce sans délai', async () => {
    const fixture = await monter();
    fixture.componentInstance.erreur.set('Ce code est déjà utilisé.');
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    const erreur = racine.querySelector('.champ__erreur');

    expect(erreur?.textContent).toContain('Ce code est déjà utilisé.');
    expect(erreur?.getAttribute('role')).toBe('alert');
    expect(racine.querySelector('.champ__aide')).toBeNull();
  });

  it('annonce le caractère obligatoire autrement que par l’astérisque', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.champ__requis')?.getAttribute('aria-hidden')).toBe('true');
    expect(racine.textContent).toContain('obligatoire');
  });
});
