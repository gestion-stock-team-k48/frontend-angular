import { defineConfig } from 'vitest/config';

/**
 * Réglages du lanceur de tests, repris par le builder Angular (`runnerConfig`).
 *
 * Le seul écart au défaut est le délai maximal par test. Vitest s'arrête à cinq secondes ;
 * un test qui monte un composant Angular, résout ses ressources et attend la stabilité tient
 * largement dedans sur une machine au repos — une seconde ou deux —, mais dépasse dès que la
 * machine travaille par ailleurs. On voyait alors cinq échecs, jamais les mêmes, dans cinq
 * fichiers différents, tous à « Test timed out ». La CI, elle, restait verte.
 *
 * Un test qui échoue selon la charge de la machine apprend à relancer plutôt qu'à lire, et
 * c'est ainsi qu'un rouge finit par ne plus rien vouloir dire. Vingt secondes laissent la
 * marge nécessaire sans masquer une vraie lenteur : un test réellement bloqué la dépassera
 * tout autant.
 */
export default defineConfig({
  test: {
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
