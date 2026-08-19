import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NAVIGATION } from '../navigation';

interface Miette {
  readonly libelle: string;
  readonly chemin: string;
  readonly dernier: boolean;
}

/**
 * Fil d'Ariane construit depuis l'URL courante, en reprenant les libellés de la
 * navigation quand ils existent. Un segment inconnu est affiché tel quel, adouci.
 */
@Component({
  selector: 'app-fil-ariane',
  templateUrl: './fil-ariane.html',
  styleUrl: './fil-ariane.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class FilAriane {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
      map((evenement) => evenement.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly miettes = computed<readonly Miette[]>(() => {
    const segments = this.url()
      .split('?')[0]
      ?.split('/')
      .filter((segment) => segment.length > 0);

    if (!segments || segments.length === 0) {
      return [];
    }

    return segments.map((segment, index) => {
      const chemin = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        chemin,
        libelle: libelleDuChemin(chemin) ?? adoucir(segment),
        dernier: index === segments.length - 1,
      };
    });
  });
}

/** Retrouve le libellé métier d'un chemin déclaré dans la navigation. */
function libelleDuChemin(chemin: string): string | null {
  for (const groupe of NAVIGATION) {
    for (const entree of groupe.entrees) {
      if (entree.chemin === chemin) {
        return entree.libelle;
      }
    }
  }
  return null;
}

/** `commandes-client` devient « Commandes client ». */
function adoucir(segment: string): string {
  const mots = segment.replace(/-/g, ' ');
  return mots.charAt(0).toUpperCase() + mots.slice(1);
}
