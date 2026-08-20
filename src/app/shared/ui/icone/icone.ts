import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NomIcone =
  | 'tableau-de-bord'
  | 'articles'
  | 'categories'
  | 'mouvements'
  | 'alertes'
  | 'clients'
  | 'fournisseurs'
  | 'commande-client'
  | 'commande-fournisseur'
  | 'ventes'
  | 'entreprise'
  | 'utilisateurs'
  | 'profil'
  | 'apparence'
  | 'menu'
  | 'soleil'
  | 'lune'
  | 'sortie';

/**
 * Tracés des icônes, dans une grille de 24.
 *
 * Dessinées ici plutôt qu'importées : une police d'icônes ou un paquet tiers pèserait plus
 * lourd que ces quelques chemins, et suivrait sa propre grammaire au lieu de la nôtre. Toutes
 * sont au trait, même épaisseur, mêmes extrémités arrondies.
 */
const TRACES: Readonly<Record<NomIcone, readonly string[]>> = {
  'tableau-de-bord': ['M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z'],
  articles: ['M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z', 'M4 7.5 12 12l8-4.5', 'M12 12v9'],
  categories: ['M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v4H4zM14 16h6v4h-6z'],
  mouvements: ['M4 8h12', 'm13 5 3 3-3 3', 'M20 16H8', 'm11 13-3 3 3 3'],
  alertes: ['M12 4 3 20h18z', 'M12 10v5', 'M12 17.5v.5'],
  clients: ['M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5 20a7 7 0 0 1 14 0'],
  fournisseurs: [
    'M3 16V9l4-4h6l4 4v7',
    'M3 16h18',
    'M7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    'M17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  ],
  'commande-client': ['M5 6h14l-1.5 10.5H6.5z', 'M9 6a3 3 0 0 1 6 0', 'M8 20h8'],
  'commande-fournisseur': [
    'M4 6h10v8H4z',
    'M14 9h4l2 3v2h-6z',
    'M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    'M17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  ],
  ventes: ['M4 19h16', 'M7 19v-6', 'M12 19V6', 'M17 19v-9'],
  entreprise: ['M4 20V6l7-3v17', 'M11 10h9v10', 'M15 14h1', 'M15 17h1'],
  utilisateurs: [
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M3 20a6 6 0 0 1 12 0',
    'M16 6.5a2.75 2.75 0 0 1 0 5.5',
    'M17 15a5 5 0 0 1 4 5',
  ],
  profil: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
  apparence: [
    'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.2-2-.8-1 0-2 1.3-2H17a4 4 0 0 0 4-4c0-5-4-10-9-10z',
    'M7.5 12.5v.01',
    'M10 8.5v.01',
    'M14.5 8v.01',
  ],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  soleil: [
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4',
  ],
  lune: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
  sortie: ['M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4', 'M10 16l-4-4 4-4', 'M6 12h10'],
};

/**
 * Icône au trait.
 *
 * Décorative par défaut — elle accompagne un texte qui dit déjà de quoi il s'agit. Un
 * libellé n'est fourni que lorsqu'elle est seule, sur un bouton d'icône.
 */
@Component({
  selector: 'app-icone',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="libelle() === null ? 'true' : null"
      [attr.role]="libelle() === null ? null : 'img'"
      [attr.aria-label]="libelle()"
    >
      @for (trace of traces(); track trace) {
        <path [attr.d]="trace" />
      }
    </svg>
  `,
  styleUrl: './icone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icone {
  readonly nom = input.required<NomIcone>();

  /** Libellé lu à voix haute. Absent, l'icône est purement décorative. */
  readonly libelle = input<string | null>(null);

  protected readonly traces = computed(() => TRACES[this.nom()]);
}
