import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nombreAnime } from './nombre-anime';

/** Remplace `matchMedia` pour décider si l'environnement demande moins de mouvement. */
function simulerMouvement(reduit: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (requete: string) =>
      ({
        matches: reduit && requete.includes('reduced-motion'),
        media: requete,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

describe('nombreAnime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pose la valeur d’un coup quand le mouvement est refusé', () => {
    simulerMouvement(true);
    TestBed.configureTestingModule({});

    const source = signal(4500);
    const anime = TestBed.runInInjectionContext(() => nombreAnime(() => source()));
    TestBed.tick();

    expect(anime()).toBe(4500);
  });

  it('part de zéro puis rejoint la cible quand le mouvement est permis', async () => {
    simulerMouvement(false);
    TestBed.configureTestingModule({});

    const source = signal(1000);
    const anime = TestBed.runInInjectionContext(() => nombreAnime(() => source()));
    TestBed.tick();

    // Au premier instant, le décompte n'a pas encore couru.
    expect(anime()).toBeLessThan(1000);

    await new Promise((suite) => setTimeout(suite, 1100));
    expect(anime()).toBe(1000);
  });
});
