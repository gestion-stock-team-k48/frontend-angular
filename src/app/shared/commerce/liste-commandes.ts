import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom, type Observable } from 'rxjs';
import { ServiceNotifications } from '../../core/notifications/notifications';
import { Badge } from '../ui/badge/badge';
import { Bouton } from '../ui/bouton/bouton';
import { EtatVide } from '../ui/etat-vide/etat-vide';
import { Modale } from '../ui/modale/modale';
import { Pagination } from '../ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../ui/tableau/tableau';
import { MontantPipe } from '../pipes/montant';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
  type Tri,
} from '../../core/api/pagination';
import { libelleEtat, supprimable, tonEtat } from './etats-commande';
import type { CommandeVue } from './commande';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'codeCommande', libelle: 'Code', triable: true },
  { cle: 'dateCommande', libelle: 'Date', triable: true },
  { cle: 'tiers', libelle: 'Tiers' },
  { cle: 'etatCommande', libelle: 'État', triable: true },
  { cle: 'totalTtc', libelle: 'Total TTC', triable: true, alignement: 'fin' },
];

/**
 * Liste d'un module de commandes.
 *
 * Commandes client et commandes fournisseur ne diffèrent que par leur tiers : la liste est
 * écrite une fois et reçoit la traduction vers la forme commune (ADR-019).
 */
@Component({
  selector: 'app-liste-commandes',
  templateUrl: './liste-commandes.html',
  styleUrl: './liste-commandes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    Badge,
    Bouton,
    EtatVide,
    Modale,
    Pagination,
    Tableau,
    MontantPipe,
  ],
})
export class ListeCommandes<T> {
  private readonly notifications = inject(ServiceNotifications);

  readonly titre = input.required<string>();
  readonly sousTitre = input.required<string>();
  readonly libelleTiers = input.required<string>();
  readonly cheminBase = input.required<string>();
  readonly url = input.required<string>();

  /**
   * Traduction d'une réponse du module vers la forme commune. Le composant est générique :
   * le type de la réponse reste celui du module, sans conversion aveugle.
   */
  readonly versVue = input.required<(reponse: T) => CommandeVue>();

  readonly supprimer = input.required<(id: number) => Observable<void>>();

  protected readonly colonnes = COLONNES;
  protected readonly libelleEtat = libelleEtat;
  protected readonly tonEtat = tonEtat;
  protected readonly supprimable = supprimable;

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);
  protected readonly tri = signal<Tri>({ champ: 'dateCommande', sens: 'desc' });

  private readonly ressource = httpResource<ReponsePage<T>>(() => ({
    url: this.url(),
    params: parametresDePage({ page: this.page(), taille: this.taille(), tri: this.tri() }),
  }));

  protected readonly commandes = computed(() =>
    contenuDePage(this.ressource.value()).map((reponse) => this.versVue()(reponse)),
  );

  protected readonly etatPage = computed(() => etatDePage(this.ressource.value()));

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.commandes().length === 0 ? 'vide' : 'pret';
  });

  protected readonly aSupprimer = signal<CommandeVue | null>(null);
  protected readonly suppressionEnCours = signal(false);

  protected changerTri(tri: Tri): void {
    this.tri.set(tri);
    this.page.set(0);
  }

  protected changerTaille(taille: number): void {
    this.taille.set(taille);
    this.page.set(0);
  }

  protected async confirmerSuppression(): Promise<void> {
    const commande = this.aSupprimer();
    if (commande?.id === undefined) {
      return;
    }

    this.suppressionEnCours.set(true);
    try {
      await firstValueFrom(this.supprimer()(commande.id));
      this.notifications.succes('Commande supprimée', commande.code ?? '');
      this.aSupprimer.set(null);
      this.rechargerApresSuppression();
    } catch {
      // L'intercepteur d'erreurs a déjà présenté le refus du serveur.
    } finally {
      this.suppressionEnCours.set(false);
    }
  }

  protected reessayer(): void {
    this.ressource.reload();
  }

  private rechargerApresSuppression(): void {
    const etat = this.etatPage();
    if (etat.nombreElements === 1 && !etat.premiere) {
      this.page.set(etat.numero - 1);
      return;
    }
    this.ressource.reload();
  }
}
