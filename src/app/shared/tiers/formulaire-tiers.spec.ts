import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { FormulaireTiers } from './formulaire-tiers';
import type { DemandeTiers } from './champs-tiers';

@Component({
  imports: [FormulaireTiers],
  template: `<app-formulaire-tiers
    [tiers]="tiers()"
    [action]="action"
    (enregistre)="enregistre.set(true)"
  />`,
})
class Hote {
  readonly tiers = signal<Partial<DemandeTiers> | null>(null);
  readonly envoyees = signal<DemandeTiers | null>(null);
  readonly enregistre = signal(false);
  readonly echec = signal<HttpErrorResponse | null>(null);

  readonly action = (demande: DemandeTiers): Observable<unknown> => {
    this.envoyees.set(demande);
    const echec = this.echec();
    return echec === null ? of({ id: 1 }) : throwError(() => echec);
  };
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
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

async function envoyer(fixture: Awaited<ReturnType<typeof monter>>): Promise<void> {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
  for (let tour = 0; tour < 5; tour += 1) {
    await Promise.resolve();
    fixture.detectChanges();
  }
}

describe('FormulaireTiers', () => {
  it('refuse un formulaire sans nom ni email', async () => {
    const fixture = await monter();

    await envoyer(fixture);

    expect(fixture.componentInstance.envoyees()).toBeNull();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Le nom est obligatoire');
    expect(texte).toContain("L'email est obligatoire");
  });

  it('refuse un email mal formé', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#tiers-nom', 'Ngono');
    saisir(racine, '#tiers-prenom', 'Alice');
    saisir(racine, '#tiers-email', 'alice');
    await envoyer(fixture);

    expect(fixture.componentInstance.envoyees()).toBeNull();
    expect(racine.textContent).toContain("L'email doit être valide");
  });

  it('appelle l’action fournie avec la demande nettoyée', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#tiers-nom', 'Ngono');
    saisir(racine, '#tiers-prenom', 'Alice');
    saisir(racine, '#tiers-email', 'alice@exemple.cm');
    saisir(racine, '#tiers-ville', 'Douala');
    await envoyer(fixture);

    expect(fixture.componentInstance.envoyees()).toEqual({
      nom: 'Ngono',
      prenom: 'Alice',
      email: 'alice@exemple.cm',
      ville: 'Douala',
    });
    expect(fixture.componentInstance.enregistre()).toBe(true);
  });

  it('repose l’erreur du serveur sous le champ qu’elle nomme', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.echec.set(
      new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: {
          timestamp: '2026-08-19T11:00:43',
          status: 409,
          error: 'Conflict',
          message: 'Un client avec cet email existe déjà',
          path: '/api/v1/clients',
          validationErrors: { email: 'Un client avec cet email existe déjà' },
        },
      }),
    );

    saisir(racine, '#tiers-nom', 'Ngono');
    saisir(racine, '#tiers-prenom', 'Alice');
    saisir(racine, '#tiers-email', 'alice@exemple.cm');
    await envoyer(fixture);
    await fixture.whenStable();

    expect(racine.querySelector('.champ__erreur')?.textContent).toContain(
      'Un client avec cet email existe déjà',
    );
    // Le message a trouvé son champ : pas de bandeau qui le répète.
    expect(racine.querySelector('.formulaire-tiers__bandeau')).toBeNull();
    expect(fixture.componentInstance.enregistre()).toBe(false);
  });

  it('reprend les valeurs du tiers reçu', async () => {
    const fixture = await monter();
    fixture.componentInstance.tiers.set({ nom: 'Ngono', prenom: 'Alice', ville: 'Douala' });
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector<HTMLInputElement>('#tiers-nom')?.value).toBe('Ngono');
    expect(racine.querySelector<HTMLInputElement>('#tiers-ville')?.value).toBe('Douala');
  });
});
