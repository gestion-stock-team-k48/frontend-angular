import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { QuantitePipe } from './quantite';
import { provideAppConfig } from '../../core/config/app-config';

function normaliser(valeur: string): string {
  return valeur.replace(/\s/gu, ' ');
}

describe('QuantitePipe', () => {
  let pipe: QuantitePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAppConfig()] });
    pipe = TestBed.runInInjectionContext(() => new QuantitePipe());
  });

  it('n’affiche pas de décimale quand il n’y en a pas', () => {
    expect(normaliser(pipe.transform(1200))).toBe('1 200');
  });

  it('garde les décimales d’une quantité qui en a', () => {
    expect(pipe.transform(2.5)).toBe('2,5');
  });

  it('rend un tiret pour une quantité absente', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });
});
