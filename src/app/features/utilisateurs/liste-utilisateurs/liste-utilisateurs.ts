import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Badge } from '../../../shared/ui/badge/badge';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { Modale } from '../../../shared/ui/modale/modale';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
  type Tri,
} from '../../../core/api/pagination';
import { ApiUtilisateurs } from '../utilisateur-api';
import { libelleRole } from '../roles';
import type { Utilisateur } from '../../../core/api/api-types';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'nom', libelle: 'Nom', triable: true },
  { cle: 'prenom', libelle: 'Prénom', triable: true },
  { cle: 'email', libelle: 'Email', triable: true },
  { cle: 'roles', libelle: 'Rôles' },
  { cle: 'motDePasse', libelle: 'Mot de passe' },
];

/**
 * Liste des utilisateurs de l'entreprise.
 *
 * Un compte encore porteur de son mot de passe temporaire est signalé : c'est l'information
 * qu'un administrateur cherche quand il se demande si son collègue s'est déjà connecté.
 */
@Component({
  selector: 'app-liste-utilisateurs',
  templateUrl: './liste-utilisateurs.html',
  styleUrl: './liste-utilisateurs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Bouton, EtatVide, Modale, Pagination, Tableau],
})
export class ListeUtilisateurs {
  private readonly api = inject(ApiUtilisateurs);
  private readonly auth = inject(ServiceAuthentification);
  private readonly notifications = inject(ServiceNotifications);

  protected readonly colonnes = COLONNES;
  protected readonly libelleRole = libelleRole;

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);
  protected readonly tri = signal<Tri>({ champ: 'nom', sens: 'asc' });

  private readonly ressource = httpResource<ReponsePage<Utilisateur>>(() => ({
    url: this.api.url,
    params: parametresDePage({ page: this.page(), taille: this.taille(), tri: this.tri() }),
  }));

  protected readonly utilisateurs = computed(() => contenuDePage(this.ressource.value()));

  protected readonly etatPage = computed(() => etatDePage(this.ressource.value()));

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.utilisateurs().length === 0 ? 'vide' : 'pret';
  });

  protected readonly aSupprimer = signal<Utilisateur | null>(null);
  protected readonly suppressionEnCours = signal(false);

  /**
   * Son propre compte ne se supprime pas depuis cet écran : le backend l'accepterait, et
   * l'administrateur se fermerait la porte au nez. Garde-fou d'interface, pas de sécurité.
   */
  protected estMoi(utilisateur: Utilisateur): boolean {
    return utilisateur.id !== undefined && utilisateur.id === this.auth.utilisateur()?.id;
  }

  protected changerTri(tri: Tri): void {
    this.tri.set(tri);
    this.page.set(0);
  }

  protected changerTaille(taille: number): void {
    this.taille.set(taille);
    this.page.set(0);
  }

  protected async confirmerSuppression(): Promise<void> {
    const utilisateur = this.aSupprimer();
    if (utilisateur?.id === undefined) {
      return;
    }

    this.suppressionEnCours.set(true);
    try {
      await firstValueFrom(this.api.supprimer(utilisateur.id));
      this.notifications.succes(
        'Utilisateur supprimé',
        `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim(),
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

  private rechargerApresSuppression(): void {
    const etat = this.etatPage();
    if (etat.nombreElements === 1 && !etat.premiere) {
      this.page.set(etat.numero - 1);
      return;
    }
    this.ressource.reload();
  }
}
