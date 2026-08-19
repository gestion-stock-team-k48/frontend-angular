import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Icone } from './icone';

@Component({
  imports: [Icone],
  template: `
    <app-icone nom="articles" />
    <app-icone nom="sortie" libelle="Se déconnecter" />
  `,
})
class Hote {}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

describe('Icone', () => {
  it('se tait quand un texte dit déjà de quoi il s’agit', async () => {
    const fixture = await monter();
    const svg = (fixture.nativeElement as HTMLElement).querySelectorAll('svg')[0];

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('role')).toBeNull();
  });

  it('se nomme quand elle est seule sur un bouton', async () => {
    const fixture = await monter();
    const svg = (fixture.nativeElement as HTMLElement).querySelectorAll('svg')[1];

    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Se déconnecter');
    expect(svg?.getAttribute('aria-hidden')).toBeNull();
  });
});
