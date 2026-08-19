import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  it('rend la page d’attente du thème', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const titre = fixture.nativeElement as HTMLElement;
    expect(titre.querySelector('h1')?.textContent).toContain('Gestion de Stock');
  });

  it('bascule la densité', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const boutons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).filter((bouton) => bouton.textContent?.includes('Densité'));

    expect(boutons[0]?.textContent).toContain('confortable');

    boutons[0]?.click();
    await fixture.whenStable();

    expect(boutons[0]?.textContent).toContain('compact');
  });
});
