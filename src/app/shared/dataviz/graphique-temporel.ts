import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { graduations, plafond, serieEntiere, type PointSerie } from './serie';

/** Repère de dessin. Le SVG est décrit dans ce système, puis mis à l'échelle par le CSS. */
const LARGEUR = 640;
const HAUTEUR = 220;
const MARGE = { haut: 16, droite: 12, bas: 26 } as const;

/**
 * Gouttière de l'axe des valeurs.
 *
 * Elle est calculée sur la plus longue étiquette et non figée : « 1,5 M FCFA » ne tient pas
 * dans la même place que « 6 », et une gouttière fixe coupait les montants à ras du cadre.
 * La chasse est approchée — mesurer le texte demanderait le DOM, que le composant n'a pas au
 * moment où il calcule sa géométrie — mais la police des axes est à chasse fixe, ce qui rend
 * l'approximation sûre à un cheveu près.
 */
const CHASSE = 6.4;
const GOUTTIERE = { minimum: 34, maximum: 148, air: 14 } as const;

/** Épaisseur maximale d'une colonne : au-delà, la barre mange l'air de sa bande. */
const COLONNE_MAX = 24;

export type FormeGraphique = 'aires' | 'colonnes';

/** Compteur d'instances : deux graphiques sur un écran ne peuvent pas partager un id SVG. */
let sequence = 0;

/**
 * Série dans le temps, en courbe ou en colonnes.
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

  /** Identifiant du dégradé, propre à l'instance. */
  protected readonly idDegrade = `degrade-serie-${(sequence += 1)}`;

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

  protected readonly margeGauche = computed(() => {
    const caracteres = Math.max(0, ...this.reperes().map((repere) => repere.libelle.length));
    return Math.min(
      GOUTTIERE.maximum,
      Math.max(GOUTTIERE.minimum, Math.round(caracteres * CHASSE) + GOUTTIERE.air),
    );
  });

  protected readonly base = computed(() => this.ordonnee(0));

  protected readonly bandes = computed(() => {
    const points = this.points();
    const gauche = this.margeGauche();
    const largeurBande = (LARGEUR - gauche - MARGE.droite) / Math.max(points.length, 1);

    return points.map((point, rang) => {
      const centre = gauche + largeurBande * (rang + 0.5);
      const epaisseur = Math.min(COLONNE_MAX, largeurBande * 0.6);

      return {
        ...point,
        rang,
        centre,
        largeurBande,
        debutBande: gauche + largeurBande * rang,
        x: centre - epaisseur / 2,
        epaisseur,
        y: this.ordonnee(point.valeur),
        hauteurBarre: Math.max(0, this.ordonnee(0) - this.ordonnee(point.valeur)),
      };
    });
  });

  /**
   * Ligne de la série, lissée.
   *
   * L'interpolation est une Hermite monotone (Fritsch–Carlson) : elle arrondit les sommets
   * sans jamais dépasser les valeurs voisines. Une spline ordinaire, elle, plongerait sous
   * l'axe après une suite de zéros et remonterait au-dessus du plafond après un pic — deux
   * mensonges que le lecteur prendrait pour des données.
   */
  protected readonly trace = computed(() => {
    const sommets = this.bandes().map((bande) => ({ x: bande.centre, y: bande.y }));
    if (sommets.length === 0) {
      return '';
    }

    const premier = sommets[0];
    if (premier === undefined) {
      return '';
    }

    const tangentes = tangentesMonotones(sommets);
    let chemin = `M ${arrondir(premier.x)} ${arrondir(premier.y)}`;

    for (let rang = 0; rang < sommets.length - 1; rang += 1) {
      const depart = sommets[rang];
      const arrivee = sommets[rang + 1];
      const penteDepart = tangentes[rang];
      const penteArrivee = tangentes[rang + 1];
      if (
        depart === undefined ||
        arrivee === undefined ||
        penteDepart === undefined ||
        penteArrivee === undefined
      ) {
        continue;
      }

      const tiers = (arrivee.x - depart.x) / 3;
      chemin +=
        ` C ${arrondir(depart.x + tiers)} ${arrondir(depart.y + penteDepart * tiers)}` +
        ` ${arrondir(arrivee.x - tiers)} ${arrondir(arrivee.y - penteArrivee * tiers)}` +
        ` ${arrondir(arrivee.x)} ${arrondir(arrivee.y)}`;
    }

    return chemin;
  });

  /** Remplissage sous la ligne : un dégradé qui s'éteint sur l'axe, jamais un aplat. */
  protected readonly aire = computed(() => {
    const bandes = this.bandes();
    const premier = bandes[0];
    const dernier = bandes[bandes.length - 1];
    if (premier === undefined || dernier === undefined) {
      return '';
    }
    const base = arrondir(this.base());
    return `${this.trace()} L ${arrondir(dernier.centre)} ${base} L ${arrondir(premier.centre)} ${base} Z`;
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

  /**
   * Ancrage de l'infobulle : centrée au milieu du dessin, alignée sur son bord aux extrémités.
   * Sans cela, l'infobulle du premier et du dernier mois sortait de la carte.
   */
  protected readonly ancrageInfobulle = computed<'debut' | 'centre' | 'fin'>(() => {
    const position = this.positionInfobulle();
    if (position < 18) {
      return 'debut';
    }
    return position > 82 ? 'fin' : 'centre';
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

/** Trois décimales suffisent à un tracé, et raccourcissent d'autant l'attribut `d`. */
function arrondir(valeur: number): number {
  return Math.round(valeur * 1000) / 1000;
}

/**
 * Tangentes d'une Hermite monotone : nulles à chaque changement de sens, bornées au tiers de
 * la plus faible pente voisine — c'est cette borne qui interdit tout dépassement.
 */
function tangentesMonotones(sommets: readonly { x: number; y: number }[]): readonly number[] {
  const pentes: number[] = [];
  for (let rang = 0; rang < sommets.length - 1; rang += 1) {
    const depart = sommets[rang];
    const arrivee = sommets[rang + 1];
    pentes.push(
      depart === undefined || arrivee === undefined || arrivee.x === depart.x
        ? 0
        : (arrivee.y - depart.y) / (arrivee.x - depart.x),
    );
  }

  return sommets.map((_, rang) => {
    const avant = pentes[rang - 1];
    const apres = pentes[rang];
    if (avant === undefined) {
      return apres ?? 0;
    }
    if (apres === undefined) {
      return avant;
    }
    if (avant * apres <= 0) {
      return 0;
    }

    const moyenne = (avant + apres) / 2;
    const borne = 3 * Math.min(Math.abs(avant), Math.abs(apres));
    return Math.sign(moyenne) * Math.min(Math.abs(moyenne), borne);
  });
}
