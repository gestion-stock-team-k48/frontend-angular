import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { Modale } from '../../../shared/ui/modale/modale';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import { FormulaireCategorie } from '../formulaire-categorie/formulaire-categorie';
import { ApiCategories } from '../categorie-api';
import type { Categorie } from '../../../core/api/api-types';
import type { Tri } from '../../../core/api/pagination';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'code', libelle: 'Code', triable: true },
  { cle: 'designation', libelle: 'Désignation', triable: true },
];

/**
 * Liste des catégories.
 *
 * `GET /categories` renvoie tout d'un coup : le tri se fait donc ici, sur des données déjà
 * en mémoire, et non par un aller-retour serveur qui n'apporterait rien.
 */
@Component({
  selector: 'app-liste-categories',
  templateUrl: './liste-categories.html',
  styleUrl: './liste-categories.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Bouton, EtatVide, Modale, Tableau, FormulaireCategorie],
})
export class ListeCategories {
  private readonly api = inject(ApiCategories);
  private readonly notifications = inject(ServiceNotifications);

  protected readonly colonnes = COLONNES;

  private readonly ressource = httpResource<Categorie[]>(() => this.api.url, {
    defaultValue: [],
  });

  protected readonly tri = signal<Tri>({ champ: 'code', sens: 'asc' });

  protected readonly categories = computed(() => {
    const tri = this.tri();
    const facteur = tri.sens === 'asc' ? 1 : -1;

    return [...this.ressource.value()].sort((gauche, droite) => {
      const a = (tri.champ === 'code' ? gauche.code : gauche.designation) ?? '';
      const b = (tri.champ === 'code' ? droite.code : droite.designation) ?? '';
      return facteur * a.localeCompare(b, 'fr', { numeric: true });
    });
  });

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.categories().length === 0 ? 'vide' : 'pret';
  });

  /** Catégorie ouverte dans le formulaire : `null` pour une création, absent si fermé. */
  protected readonly formulaireOuvert = signal(false);
  protected readonly categorieEditee = signal<Categorie | null>(null);

  protected readonly categorieASupprimer = signal<Categorie | null>(null);
  protected readonly suppressionEnCours = signal(false);

  protected readonly titreFormulaire = computed(() =>
    this.categorieEditee() === null ? 'Nouvelle catégorie' : 'Modifier la catégorie',
  );

  protected ouvrirCreation(): void {
    this.categorieEditee.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirModification(categorie: Categorie): void {
    this.categorieEditee.set(categorie);
    this.formulaireOuvert.set(true);
  }

  protected fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
  }

  protected apresEnregistrement(categorie: Categorie): void {
    this.notifications.succes(
      this.categorieEditee() === null ? 'Catégorie créée' : 'Catégorie modifiée',
      categorie.designation,
    );
    this.formulaireOuvert.set(false);
    this.ressource.reload();
  }

  protected async supprimer(): Promise<void> {
    const categorie = this.categorieASupprimer();
    if (categorie?.id === undefined) {
      return;
    }

    this.suppressionEnCours.set(true);
    try {
      await firstValueFrom(this.api.supprimer(categorie.id));
      this.notifications.succes('Catégorie supprimée', categorie.designation);
      this.categorieASupprimer.set(null);
      this.ressource.reload();
    } catch {
      // Le message est déjà poussé par l'intercepteur d'erreurs : le doubler ici
      // afficherait deux fois la même phrase. La modale reste ouverte, l'utilisateur voit
      // sur quelle ligne le refus porte.
    } finally {
      this.suppressionEnCours.set(false);
    }
  }

  protected reessayer(): void {
    this.ressource.reload();
  }
}
