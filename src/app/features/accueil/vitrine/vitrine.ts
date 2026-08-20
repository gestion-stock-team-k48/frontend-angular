import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceTheme } from '../../../core/theme/theme';
import { Icone, type NomIcone } from '../../../shared/ui/icone/icone';
import { ApercuApplication } from './apercu';

interface Atout {
  readonly icone: NomIcone;
  readonly titre: string;
  readonly texte: string;
}

/**
 * Ce que l'application fait réellement — rien de plus.
 *
 * Une vitrine se tient à ce que le produit sait faire : chaque point ci-dessous correspond à
 * un écran livré. Pas de promesse à tenir plus tard, pas de témoignage inventé.
 */
const ATOUTS: readonly Atout[] = [
  {
    icone: 'articles',
    titre: 'Un catalogue qui tient debout',
    texte:
      'Articles, catégories, prix HT et TTC, seuil minimal par article. Le prix TTC est calculé, jamais saisi deux fois.',
  },
  {
    icone: 'mouvements',
    titre: 'Le stock réel, pas le stock supposé',
    texte:
      'Entrées, sorties, corrections : chaque mouvement est daté et justifié. Le stock se déduit de son historique, jamais d’une case qu’on rectifie à la main.',
  },
  {
    icone: 'alertes',
    titre: 'L’alerte avant la rupture',
    texte:
      'Chaque article porte son seuil. Ce qui passe dessous remonte tout seul, sur le tableau de bord comme sur son écran.',
  },
  {
    icone: 'commande-client',
    titre: 'Des commandes qui suivent leur cours',
    texte:
      'En préparation, validée, livrée, annulée — et rien d’autre. Livrer une commande sort le stock ; recevoir une commande fournisseur le rentre.',
  },
  {
    icone: 'tableau-de-bord',
    titre: 'Le matin, en un écran',
    texte:
      'Chiffre d’affaires du mois, commandes en cours, articles sous seuil, articles qui partent le mieux.',
  },
  {
    icone: 'apparence',
    titre: 'À vos couleurs',
    texte:
      'Une couleur d’entreprise, et toute l’interface s’y accorde — thème clair, thème sombre, densité et arrondis compris.',
  },
];

const ETAPES: readonly { rang: string; titre: string; texte: string }[] = [
  {
    rang: '1',
    titre: 'Inscrire l’entreprise',
    texte: 'Un nom, un code fiscal, un premier compte administrateur. C’est tout.',
  },
  {
    rang: '2',
    titre: 'Poser le catalogue',
    texte: 'Catégories, articles, seuils, puis le stock initial en une entrée par article.',
  },
  {
    rang: '3',
    titre: 'Travailler',
    texte: 'Commandes, ventes, mouvements. Les chiffres du tableau de bord suivent d’eux-mêmes.',
  },
];

@Component({
  selector: 'app-vitrine',
  templateUrl: './vitrine.html',
  styleUrls: ['./vitrine.scss', './sections.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icone, ApercuApplication],
})
export class Vitrine {
  protected readonly theme = inject(ServiceTheme);

  protected readonly atouts = ATOUTS;
  protected readonly etapes = ETAPES;
  protected readonly annee = new Date().getFullYear();

  protected basculerTheme(): void {
    this.theme.definirMode(this.theme.themeApplique() === 'sombre' ? 'clair' : 'sombre');
  }
}
