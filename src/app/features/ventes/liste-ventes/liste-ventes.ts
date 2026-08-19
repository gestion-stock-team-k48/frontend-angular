import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import { MontantPipe } from '../../../shared/pipes/montant';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
  type Tri,
} from '../../../core/api/pagination';
import { ApiVentes } from '../vente-api';
import { totalVente } from '../total-vente';
import type { Vente } from '../../../core/api/api-types';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'code', libelle: 'Code', triable: true },
  { cle: 'dateVente', libelle: 'Date', triable: true },
  { cle: 'lignes', libelle: 'Lignes', alignement: 'fin' },
  { cle: 'total', libelle: 'Total', alignement: 'fin' },
  { cle: 'commentaire', libelle: 'Commentaire' },
];

/**
 * Liste des ventes.
 *
 * Une vente ne se modifie ni ne se supprime : l'écran ne propose que de consulter et de
 * créer. La recherche par code passe par le seul endpoint de recherche du backend,
 * `GET /ventes/code/{code}`, qui rend une vente ou rien.
 */
@Component({
  selector: 'app-liste-ventes',
  templateUrl: './liste-ventes.html',
  styleUrl: './liste-ventes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Bouton, Champ, EtatVide, Pagination, Tableau, MontantPipe],
})
export class ListeVentes {
  protected readonly api = inject(ApiVentes);
  private readonly router = inject(Router);

  protected readonly colonnes = COLONNES;
  protected readonly totalVente = totalVente;

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);
  protected readonly tri = signal<Tri>({ champ: 'dateVente', sens: 'desc' });

  private readonly ressource = httpResource<ReponsePage<Vente>>(() => ({
    url: this.api.url,
    params: parametresDePage({ page: this.page(), taille: this.taille(), tri: this.tri() }),
  }));

  protected readonly ventes = computed(() => contenuDePage(this.ressource.value()));

  protected readonly etatPage = computed(() => etatDePage(this.ressource.value()));

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.ventes().length === 0 ? 'vide' : 'pret';
  });

  protected readonly codeCherche = signal('');
  protected readonly rechercheEnCours = signal(false);
  protected readonly messageRecherche = signal<string | null>(null);

  protected changerTri(tri: Tri): void {
    this.tri.set(tri);
    this.page.set(0);
  }

  protected changerTaille(taille: number): void {
    this.taille.set(taille);
    this.page.set(0);
  }

  protected majCode(evenement: Event): void {
    const cible = evenement.target;
    if (cible instanceof HTMLInputElement) {
      this.codeCherche.set(cible.value);
    }
  }

  protected async chercher(): Promise<void> {
    const code = this.codeCherche().trim();
    this.messageRecherche.set(null);

    if (code === '') {
      this.messageRecherche.set('Saisir le code de la vente à retrouver.');
      return;
    }

    this.rechercheEnCours.set(true);
    try {
      const vente = await firstValueFrom(this.api.chercherParCode(code));
      await this.router.navigate(['/ventes', vente.id]);
    } catch {
      this.messageRecherche.set(`Aucune vente ne porte le code « ${code} ».`);
    } finally {
      this.rechercheEnCours.set(false);
    }
  }

  protected reessayer(): void {
    this.ressource.reload();
  }
}
