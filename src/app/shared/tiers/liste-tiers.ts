import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom, type Observable } from 'rxjs';
import { ServiceNotifications } from '../../core/notifications/notifications';
import { Bouton } from '../ui/bouton/bouton';
import { EtatVide } from '../ui/etat-vide/etat-vide';
import { Modale } from '../ui/modale/modale';
import { Pagination } from '../ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../ui/tableau/tableau';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
  type Tri,
} from '../../core/api/pagination';
import type { Client, Fournisseur } from '../../core/api/api-types';

/** Un client et un fournisseur se listent avec les mêmes colonnes. */
export type Tiers = Client | Fournisseur;

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'nom', libelle: 'Nom', triable: true },
  { cle: 'prenom', libelle: 'Prénom', triable: true },
  { cle: 'email', libelle: 'Email', triable: true },
  { cle: 'numTel', libelle: 'Téléphone' },
  { cle: 'ville', libelle: 'Ville', triable: true },
];

/**
 * Liste d'un module de tiers.
 *
 * Clients et fournisseurs partagent leurs champs, leurs contraintes et leurs colonnes : ils
 * partagent donc cet écran, qui reçoit ce qui les distingue — libellés, chemin, endpoint —
 * et rien de plus. Aucune URL n'est construite ici (ADR-018).
 */
@Component({
  selector: 'app-liste-tiers',
  templateUrl: './liste-tiers.html',
  styleUrl: './liste-tiers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Bouton, EtatVide, Modale, Pagination, Tableau],
})
export class ListeTiers {
  private readonly notifications = inject(ServiceNotifications);

  readonly titre = input.required<string>();
  readonly sousTitre = input.required<string>();

  /** Endpoint de la liste paginée. */
  readonly url = input.required<string>();

  /** Racine des écrans du module, par exemple `/clients`. */
  readonly cheminBase = input.required<string>();

  /** « client » ou « fournisseur », au singulier, tel qu'il apparaît dans les phrases. */
  readonly singulier = input.required<string>();

  readonly supprimer = input.required<(id: number) => Observable<void>>();

  protected readonly colonnes = COLONNES;

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);
  protected readonly tri = signal<Tri>({ champ: 'nom', sens: 'asc' });

  private readonly ressource = httpResource<ReponsePage<Tiers>>(() => ({
    url: this.url(),
    params: parametresDePage({ page: this.page(), taille: this.taille(), tri: this.tri() }),
  }));

  protected readonly tiers = computed(() => contenuDePage(this.ressource.value()));

  protected readonly etatPage = computed(() => etatDePage(this.ressource.value()));

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.tiers().length === 0 ? 'vide' : 'pret';
  });

  protected readonly aSupprimer = signal<Tiers | null>(null);
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
    const tiers = this.aSupprimer();
    if (tiers?.id === undefined) {
      return;
    }

    this.suppressionEnCours.set(true);
    try {
      await firstValueFrom(this.supprimer()(tiers.id));
      this.notifications.succes(
        `${majuscule(this.singulier())} supprimé`,
        `${tiers.prenom ?? ''} ${tiers.nom ?? ''}`.trim(),
      );
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

  /** Supprimer le dernier élément d'une page vide cette page : reculer d'un cran. */
  private rechargerApresSuppression(): void {
    const etat = this.etatPage();
    if (etat.nombreElements === 1 && !etat.premiere) {
      this.page.set(etat.numero - 1);
      return;
    }
    this.ressource.reload();
  }
}

function majuscule(mot: string): string {
  return mot.charAt(0).toUpperCase() + mot.slice(1);
}
