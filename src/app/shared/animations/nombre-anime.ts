import { DestroyRef, effect, inject, signal, untracked, type Signal } from '@angular/core';

/** Durée du décompte. Assez longue pour être vue, assez courte pour ne pas faire attendre. */
const DUREE = 900;

/**
 * Fait courir un nombre de sa valeur précédente vers sa valeur cible.
 *
 * Réservé aux mesures d'un tableau de bord : un chiffre qui s'installe se remarque, là où
 * un chiffre déjà posé se lit sans être vu. Nulle part ailleurs — un montant de facture qui
 * défile serait une coquetterie.
 *
 * `prefers-reduced-motion` coupe l'animation : la valeur est posée d'un coup.
 */
export function nombreAnime(source: () => number): Signal<number> {
  const valeur = signal(0);
  const destruction = inject(DestroyRef);
  const reduit = mouvementReduit();
  let image = 0;

  const arreter = (): void => {
    if (image !== 0) {
      cancelAnimationFrame(image);
      image = 0;
    }
  };

  destruction.onDestroy(arreter);

  effect(() => {
    const cible = source();
    arreter();

    if (reduit || !Number.isFinite(cible)) {
      valeur.set(Number.isFinite(cible) ? cible : 0);
      return;
    }

    const depart = untracked(valeur);
    const debut = performance.now();

    // L'horloge est relue à chaque image plutôt que prise dans l'argument de
    // `requestAnimationFrame` : leurs origines diffèrent d'un environnement à l'autre, et
    // un décalage y produisait un avancement négatif.
    const pas = (): void => {
      const avancement = Math.min(1, Math.max(0, (performance.now() - debut) / DUREE));
      valeur.set(depart + (cible - depart) * adouci(avancement));

      if (avancement < 1) {
        image = requestAnimationFrame(pas);
        return;
      }
      image = 0;
    };

    image = requestAnimationFrame(pas);
  });

  return valeur.asReadonly();
}

/** Décélération : le chiffre part vite et se pose doucement sur sa valeur. */
function adouci(avancement: number): number {
  return 1 - (1 - avancement) ** 3;
}

function mouvementReduit(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
