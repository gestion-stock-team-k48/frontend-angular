import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import {
  PRESETS_AMORCE,
  ServiceTheme,
  type Densite,
  type ModeTheme,
  type Rayon,
} from '../../../core/theme/theme';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Badge } from '../../../shared/ui/badge/badge';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { JaugeSeuil } from '../../../shared/ui/jauge-seuil/jauge-seuil';
import { Modale } from '../../../shared/ui/modale/modale';
import { Squelette } from '../../../shared/ui/squelette/squelette';

interface Option<T> {
  readonly valeur: T;
  readonly libelle: string;
}

/**
 * Écran « Apparence ».
 *
 * Il sert deux usages à la fois : régler le thème de l'entreprise, et servir de page de
 * démonstration du design system. Les deux vont ensemble — c'est en voyant les composants
 * réagir qu'on juge un réglage de couleur.
 */
@Component({
  selector: 'app-apparence',
  templateUrl: './apparence.html',
  styleUrl: './apparence.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanel,
    TabContent,
    Badge,
    Bouton,
    Champ,
    EtatVide,
    JaugeSeuil,
    Modale,
    Squelette,
  ],
})
export class Apparence {
  protected readonly theme = inject(ServiceTheme);
  private readonly notifications = inject(ServiceNotifications);

  protected readonly presets = PRESETS_AMORCE;
  protected readonly ongletSelectionne = signal<string>('reglages');
  protected readonly modaleOuverte = signal(false);
  protected readonly enChargement = signal(false);

  protected readonly modes: readonly Option<ModeTheme>[] = [
    { valeur: 'clair', libelle: 'Clair' },
    { valeur: 'sombre', libelle: 'Sombre' },
    { valeur: 'systeme', libelle: 'Système' },
  ];

  protected readonly densites: readonly Option<Densite>[] = [
    { valeur: 'confortable', libelle: 'Confortable' },
    { valeur: 'compact', libelle: 'Compact' },
  ];

  protected readonly rayons: readonly Option<Rayon>[] = [
    { valeur: 'net', libelle: 'Net' },
    { valeur: 'doux', libelle: 'Doux' },
    { valeur: 'arrondi', libelle: 'Arrondi' },
  ];

  /** Trois articles fictifs, uniquement pour montrer les trois états de la jauge. */
  protected readonly exemplesJauge = [
    { article: 'Ciment 50 kg', stock: 142, seuil: 40 },
    { article: 'Fer à béton 8 mm', stock: 12, seuil: 30 },
    { article: 'Tôle bac acier', stock: 0, seuil: 15 },
  ] as const;

  protected majTeinte(evenement: Event): void {
    const cible = evenement.target as HTMLInputElement;
    this.theme.definirAmorce({ ...this.theme.amorce(), h: Number(cible.value) });
  }

  protected majChroma(evenement: Event): void {
    const cible = evenement.target as HTMLInputElement;
    this.theme.definirAmorce({ ...this.theme.amorce(), c: Number(cible.value) });
  }

  protected majClarte(evenement: Event): void {
    const cible = evenement.target as HTMLInputElement;
    this.theme.definirAmorce({ ...this.theme.amorce(), l: Number(cible.value) });
  }

  protected simulerChargement(): void {
    this.enChargement.set(true);
    setTimeout(() => {
      this.enChargement.set(false);
      this.notifications.succes('Commande validée');
    }, 1200);
  }

  protected montrerNotifications(): void {
    this.notifications.information('Inventaire lancé', 'Il portera sur 1 248 références.');
    this.notifications.avertissement('4 articles sont passés sous leur seuil');
    this.notifications.erreur(
      'Stock insuffisant pour ART-00187',
      '3 disponibles, 10 demandés. Réduire la quantité ou enregistrer une entrée.',
    );
  }
}
