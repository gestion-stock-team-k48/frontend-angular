import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { graduations, plafond, serieEntiere, type PointSerie } from './serie';

/** Repère de dessin. Le SVG est décrit dans ce système, puis mis à l'échelle par le CSS. */
const LARGEUR = 640;
const HAUTEUR = 220;
const MARGE = { haut: 12, droite: 8, bas: 26, gauche: 56 } as const;

/** Épaisseur maximale d'une colonne : au-delà, la barre mange l'air de sa bande. */
const COLONNE_MAX = 24;

export type FormeGraphique = 'aires' | 'colonnes';

/**
 * Série dans le temps, en aires ou en colonnes.
 *
 * Une seule série, donc une seule couleur et pas de légende : le titre dit ce qui est tracé.
 * Le SVG est mis à l'échelle par le CSS et les couleurs viennent des tokens, si bien qu'un
 * changement de thème ou de couleur d'amorce se propage sans redessiner quoi que ce soit —
 * c'est ce qu'aucune bibliothèque à canevas ne sait faire gratuitement (ADR-021).
 */
@Component({
  selector: 'app-graphique-temporel',
  templateUrl: './graphique-temporel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphiqueTemporel {
  readonly titre = input.required<string>();
  readonly points = input.required<readonly PointSerie[]>();
  readonly forme = input<FormeGraphique>('aires');

  /** Rendu d'une valeur : montant, quantité — l'écran sait, le graphique non. */
  readonly formater = input<(valeur: number) => string>((valeur) => String(valeur));

  protected readonly largeur = LARGEUR;
  protected readonly hauteur = HAUTEUR;
  protected readonly marge = MARGE;

  protected readonly survole = signal<number | null>(null);

  /** Un axe de comptages se gradue en entiers : sinon les repères se répètent à l'affichage. */
  private readonly pasMinimal = computed(() =>
    serieEntiere(this.points().map((point) => point.valeur)) ? 1 : 0,
  );

  protected readonly maximum = computed(() =>
    plafond(
      this.points().map((point) => point.valeur),
      this.pasMinimal(),
    ),
  );

  protected readonly reperes = computed(() =>
    graduations(this.maximum(), 4, this.pasMinimal()).map((valeur) => ({
      valeur,
      y: this.ordonnee(valeur),
      libelle: this.formater()(valeur),
    })),
  );

  protected readonly bandes = computed(() => {
    const points = this.points();
    const largeurBande = (LARGEUR - MARGE.gauche - MARGE.droite) / Math.max(points.length, 1);

    return points.map((point, rang) => {
      const centre = MARGE.gauche + largeurBande * (rang + 0.5);
      const epaisseur = Math.min(COLONNE_MAX, largeurBande * 0.6);

      return {
        ...point,
        rang,
        centre,
        largeurBande,
        debutBande: MARGE.gauche + largeurBande * rang,
        x: centre - epaisseur / 2,
        epaisseur,
        y: this.ordonnee(point.valeur),
        hauteurBarre: Math.max(0, this.ordonnee(0) - this.ordonnee(point.valeur)),
      };
    });
  });

  /** Ligne de la série, en aires. */
  protected readonly trace = computed(() =>
    this.bandes()
      .map((bande, rang) => `${rang === 0 ? 'M' : 'L'} ${bande.centre} ${bande.y}`)
      .join(' '),
  );

  /** Remplissage sous la ligne : un lavis, jamais un aplat. */
  protected readonly aire = computed(() => {
    const bandes = this.bandes();
    if (bandes.length === 0) {
      return '';
    }
    const base = this.ordonnee(0);
    const premier = bandes[0];
    const dernier = bandes[bandes.length - 1];
    if (premier === undefined || dernier === undefined) {
      return '';
    }
    return `${this.trace()} L ${dernier.centre} ${base} L ${premier.centre} ${base} Z`;
  });

  protected readonly pointSurvole = computed(() => {
    const rang = this.survole();
    return rang === null ? null : (this.bandes()[rang] ?? null);
  });

  /** Position de l'infobulle, en pourcentage de la largeur : le CSS s'occupe du reste. */
  protected readonly positionInfobulle = computed(() => {
    const point = this.pointSurvole();
    return point === null ? 0 : (point.centre / LARGEUR) * 100;
  });

  protected readonly vide = computed(() => this.points().every((point) => point.valeur === 0));

  protected ordonnee(valeur: number): number {
    const utile = HAUTEUR - MARGE.haut - MARGE.bas;
    return MARGE.haut + utile - (valeur / this.maximum()) * utile;
  }

  protected survoler(rang: number | null): void {
    this.survole.set(rang);
  }
}
