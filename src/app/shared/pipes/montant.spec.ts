import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MontantPipe } from './montant';
import { provideAppConfig } from '../../core/config/app-config';

/** `Intl` sépare les milliers par une espace insécable : elle est normalisée pour comparer. */
function normaliser(valeur: string): string {
  return valeur.replace(/\s/gu, ' ');
}

describe('MontantPipe', () => {
  let pipe: MontantPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAppConfig()] });
    pipe = TestBed.runInInjectionContext(() => new MontantPipe());
  });

  it('place le symbole après le montant, sans décimale', () => {
    // Le franc CFA n'a pas de subdivision en usage : zéro décimale (ADR-009).
    expect(normaliser(pipe.transform(12500))).toBe('12 500 FCFA');
  });

  it('arrondit ce qui arrive avec des décimales', () => {
    expect(normaliser(pipe.transform(999.6))).toBe('1 000 FCFA');
  });

  it('rend un tiret quand il n’y a pas de montant', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('suit la devise configurée, décimales comprises', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideAppConfig({ devise: { code: 'EUR', symbole: '€', decimales: 2 } })],
    });
    const euros = TestBed.runInInjectionContext(() => new MontantPipe());

    expect(normaliser(euros.transform(1234.5))).toBe('1 234,50 €');
  });
});
