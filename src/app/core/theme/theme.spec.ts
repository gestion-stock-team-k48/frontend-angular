import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AMORCE_PAR_DEFAUT, PRESETS_AMORCE, ServiceTheme } from './theme';
import { contraste, contrasteSurMarque } from './couleur-oklch';

const CLE = 'gestion-stock.theme';

function creerService(): ServiceTheme {
  TestBed.configureTestingModule({});
  const service = TestBed.inject(ServiceTheme);
  TestBed.tick(); // laisse l'effet d'application s'exécuter
  return service;
}

describe('ServiceTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-theme');
  });

  it('écrit la rampe de marque complète sur l’élément racine', () => {
    creerService();
    const style = document.documentElement.style;

    expect(style.getPropertyValue('--brand-500')).toBe('oklch(0.653 0.130 250.0)');
    expect(style.getPropertyValue('--brand-50')).not.toBe('');
    expect(style.getPropertyValue('--brand-950')).not.toBe('');
  });

  it('recalcule la rampe quand l’entreprise change de couleur', () => {
    const service = creerService();

    service.definirAmorce({ l: 0.62, c: 0.19, h: 27 });
    TestBed.tick();

    expect(document.documentElement.style.getPropertyValue('--brand-500')).toContain('27.0');
  });

  it('garantit un texte lisible sur la marque, y compris pour une amorce très claire', () => {
    const service = creerService();

    service.definirAmorce({ l: 0.95, c: 0.05, h: 90 });
    TestBed.tick();

    const fond = service.rampe()[service.niveauMarque()];
    expect(contraste(fond, contrasteSurMarque(fond))).toBeGreaterThanOrEqual(4.5);
    expect(document.documentElement.style.getPropertyValue('--brand-contrast')).not.toBe('');
  });

  it('reflète le mode, la densité et le rayon en attributs de données', () => {
    const service = creerService();

    service.definirMode('sombre');
    service.definirDensite('compact');
    service.definirRayon('net');
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.dataset['densite']).toBe('compact');
    expect(document.documentElement.dataset['rayon']).toBe('net');
  });

  it('persiste les réglages et les relit au démarrage suivant', () => {
    const service = creerService();
    service.definirMode('sombre');
    service.definirRayon('arrondi');
    service.definirAmorce({ l: 0.5, c: 0.13, h: 315 });
    TestBed.tick();

    TestBed.resetTestingModule();
    const relance = creerService();

    expect(relance.mode()).toBe('sombre');
    expect(relance.rayon()).toBe('arrondi');
    expect(relance.amorce()).toEqual({ l: 0.5, c: 0.13, h: 315 });
  });

  it('repart des valeurs par défaut si le thème enregistré est illisible', () => {
    localStorage.setItem(CLE, '{ ceci n’est pas du json');

    const service = creerService();

    expect(service.mode()).toBe('systeme');
    expect(service.amorce()).toEqual(AMORCE_PAR_DEFAUT);
  });

  it('écarte un thème enregistré dont l’amorce n’a pas la bonne forme', () => {
    localStorage.setItem(CLE, JSON.stringify({ mode: 'sombre', amorce: { l: 'clair' } }));

    const service = creerService();

    expect(service.amorce()).toEqual(AMORCE_PAR_DEFAUT);
    expect(service.mode()).toBe('systeme');
  });

  it('synchronise la couleur de la barre du navigateur', () => {
    const service = creerService();
    service.definirMode('sombre');
    TestBed.tick();

    const balise = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(balise?.content).toContain('oklch');
  });

  it('revient à l’apparence par défaut', () => {
    const service = creerService();
    service.definirMode('sombre');
    service.definirDensite('compact');
    TestBed.tick();

    service.reinitialiser();
    TestBed.tick();

    expect(service.mode()).toBe('systeme');
    expect(service.densite()).toBe('confortable');
    expect(document.documentElement.dataset['densite']).toBe('confortable');
  });

  it('ne propose aucun preset dans la plage réservée à la jauge de seuil', () => {
    // Vert, ambre et rouge portent le stock : une marque dans ces teintes se lirait
    // comme un signal d'état.
    for (const preset of PRESETS_AMORCE) {
      const teinte = preset.couleur.h;
      const dansLaPlageInterdite = teinte >= 20 && teinte <= 170;
      expect(dansLaPlageInterdite, `${preset.nom} (${teinte})`).toBe(false);
    }
  });
});
